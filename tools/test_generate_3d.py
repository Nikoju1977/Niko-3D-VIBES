import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
from generate_3d import validate_glb, publish, image_command, main

def glb(doc):
    payload = json.dumps(doc).encode()
    payload += b" " * (-len(payload) % 4)
    return struct.pack("<4sIIII", b"glTF", 2, 20+len(payload), len(payload), 0x4E4F534A) + payload

class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "source.glb"
        self.doc = {"asset":{"version":"2.0"},"meshes":[{"primitives":[{"attributes":{"POSITION":0}}]}]}
        self.source.write_bytes(glb(self.doc))

    def test_header_and_json(self):
        self.assertEqual(validate_glb(self.source), self.doc)

    def test_reject_empty_and_external(self):
        for doc in [{}, dict(self.doc, images=[{"uri":"https://example.com/image.png"}])]:
            self.source.write_bytes(glb(doc))
            with self.assertRaises(ValueError):
                validate_glb(self.source)

    def test_reject_truncated(self):
        self.source.write_bytes(glb(self.doc)[:-1])
        with self.assertRaises(ValueError):
            validate_glb(self.source)

    def test_publish_no_overwrite(self):
        out = self.root / "asset.glb"
        publish(self.source, out)
        self.assertEqual(out.read_bytes(), self.source.read_bytes())
        with self.assertRaises(FileExistsError):
            publish(self.source, out)

    def test_command_arguments(self):
        command = image_command(self.root, self.root / "a b.png", self.root, "cpu", 128, 2048, False)
        self.assertIn(str(self.root / "a b.png"), command)
        self.assertIn("glb", command)
        textured = image_command(self.root, self.root / "a.png", self.root, "cpu", 128, 2048, True)
        self.assertIn("--bake-texture", textured)
        self.assertIn("obj", textured)

    def test_text_validation_without_model(self):
        with patch("generate_3d.text_mesh") as model:
            self.assertEqual(main(["text","--prompt"," ","--output",str(self.root/"x.glb")]),1)
            model.assert_not_called()

    def test_pipeline_publication_with_fixture(self):
        with patch("generate_3d.text_mesh", return_value=self.source):
            out = self.root / "test.glb"
            self.assertEqual(main(["text","--prompt","robot","--output",str(out)]),0)
            self.assertEqual(out.read_bytes(),self.source.read_bytes())

if __name__ == "__main__":
    unittest.main()
