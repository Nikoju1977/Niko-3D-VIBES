#!/usr/bin/env python3
"""Studio Niko Design: local generative mesh bridge. No server, no API key."""
import argparse
import json
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import tempfile

MAX_GLB = 100 * 1024 * 1024

def validate_glb(path):
    size = path.stat().st_size
    if not 20 <= size <= MAX_GLB:
        raise ValueError("GLB vide ou supérieur à 100 Mio")
    with path.open("rb") as f:
        magic, version, length, n, kind = struct.unpack("<4sIIII", f.read(20))
        if (magic, version, length, kind) != (b"glTF", 2, size, 0x4E4F534A) or n > size-20 or n > 8*1024*1024 or n % 4:
            raise ValueError("En-tête GLB invalide")
        doc = json.loads(f.read(n))
    if not doc.get("meshes") or not any(m.get("primitives") for m in doc["meshes"]):
        raise ValueError("Aucun maillage")
    for item in doc.get("buffers", []) + doc.get("images", []):
        if item.get("uri"):
            raise ValueError("GLB non autonome : ressource URI")
    return doc

def image_command(repo, image, target, device, resolution, chunk, textured):
    return [sys.executable, str(repo / "run.py"), str(image),
            "--output-dir", str(target), "--device", device,
            "--mc-resolution", str(resolution), "--chunk-size", str(chunk),
            "--model-save-format", "obj" if textured else "glb"] + (
            ["--bake-texture", "--texture-resolution", "1024"] if textured else [])

def image_mesh(args, work):
    repo = Path(args.triposr).resolve(strict=True)
    image = Path(args.image).resolve(strict=True)
    if not (repo / "run.py").is_file() or not image.is_file():
        raise ValueError("Dépôt TripoSR ou image absent")
    if image.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"} or image.stat().st_size > 15*1024*1024:
        raise ValueError("Image JPG/PNG/WebP, 15 Mio maximum")
    from PIL import Image
    with Image.open(image) as im:
        if im.width * im.height > 24000000:
            raise ValueError("Image supérieure à 24 mégapixels")
        im.verify()
    target = work / "triposr"
    subprocess.run(image_command(repo, image, target, args.device, args.resolution, args.chunk, args.texture),
                   cwd=repo, check=True, timeout=args.timeout)
    if not args.texture:
        return target / "0" / "mesh.glb"
    import trimesh
    from PIL import Image
    mesh = trimesh.load(str(target / "0" / "mesh.obj"), force="mesh", process=False)
    uv = getattr(mesh.visual, "uv", None)
    if uv is None or len(uv) != len(mesh.vertices):
        raise ValueError("Atlas UV absent : relancez sans --texture")
    with Image.open(target / "0" / "texture.png") as im:
        tex = im.convert("RGB")
    mesh.visual = trimesh.visual.texture.TextureVisuals(uv=uv, image=tex)
    result = work / "mesh.glb"
    mesh.export(str(result))
    return result

def text_mesh(args, work):
    import torch
    import trimesh
    from shap_e.diffusion.sample import sample_latents
    from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
    from shap_e.models.download import load_model, load_config
    from shap_e.util.notebooks import decode_latent_mesh
    device = torch.device("cuda" if args.device == "auto" and torch.cuda.is_available()
                          else "cpu" if args.device == "auto" else args.device)
    if device.type == "cuda" and not torch.cuda.is_available():
        raise ValueError("CUDA indisponible : choisissez --device cpu")
    torch.manual_seed(args.seed)
    xm = load_model("transmitter", device=device)
    model = load_model("text300M", device=device)
    diffusion = diffusion_from_config(load_config("diffusion"))
    with torch.no_grad():
        latent = sample_latents(batch_size=1, model=model, diffusion=diffusion,
            guidance_scale=15.0, model_kwargs={"texts": [args.prompt]},
            progress=True, clip_denoised=True, use_fp16=device.type == "cuda",
            use_karras=True, karras_steps=args.steps, sigma_min=1e-3,
            sigma_max=160, s_churn=0)[0]
        mesh = decode_latent_mesh(xm, latent).tri_mesh()
        ply = work / "mesh.ply"
        with ply.open("wb") as f:
            mesh.write_ply(f)
    result = work / "mesh.glb"
    trimesh.load(str(ply), force="mesh", process=False).export(str(result))
    return result

def publish(source, output):
    validate_glb(source)
    # Exclusive creation preserves any existing asset.
    with output.open("xb") as dst:
        try:
            with source.open("rb") as src:
                shutil.copyfileobj(src, dst)
            dst.flush()
        except BaseException:
            dst.close()
            output.unlink(missing_ok=True)
            raise

def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="engine", required=True)
    im = sub.add_parser("image")
    im.add_argument("--triposr", required=True)
    im.add_argument("--image", required=True)
    im.add_argument("--resolution", type=int, choices=[128, 192, 256], default=128)
    im.add_argument("--chunk", type=int, choices=[1024, 2048, 4096, 8192], default=2048)
    im.add_argument("--texture", action="store_true")
    im.add_argument("--timeout", type=int, choices=[600, 1800, 3600], default=1800)
    tx = sub.add_parser("text")
    tx.add_argument("--prompt", required=True)
    tx.add_argument("--seed", type=int, default=42)
    tx.add_argument("--steps", type=int, choices=[32, 48, 64], default=64)
    for parser in [im, tx]:
        parser.add_argument("--output", required=True)
        parser.add_argument("--device", choices=["cpu", "cuda:0", "auto"], default="auto")
    a = p.parse_args(argv)
    try:
        out = Path(a.output).expanduser().absolute()
        if out.suffix.lower() != ".glb" or out.exists() or not out.parent.is_dir():
            raise ValueError("Choisissez un nouveau fichier .glb dans un dossier existant")
        if a.engine == "text" and not 1 <= len(a.prompt.strip()) <= 500:
            raise ValueError("Prompt de 1 à 500 caractères")
        if a.engine == "image" and a.device == "auto":
            a.device = "cuda:0"  # upstream TripoSR falls back to CPU
        with tempfile.TemporaryDirectory(prefix="niko3d-") as directory:
            result = (image_mesh if a.engine == "image" else text_mesh)(a, Path(directory))
            publish(result, out)
        print("GLB généré :", out)
        return 0
    except (Exception, KeyboardInterrupt) as e:
        print("Génération interrompue :", str(e) or type(e).__name__, file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
