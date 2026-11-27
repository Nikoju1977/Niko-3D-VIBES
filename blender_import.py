"""Run in Blender's scripting workspace after adjusting PATH; creates animated joint empties and bone-link meshes. No retargeting."""
import bpy, json, os, math
from mathutils import Vector
PATH = os.path.expanduser('~/Downloads/synapse-motion.json')
with open(PATH, encoding='utf-8') as file:
    data = json.load(file)
assert data['schema'] == 'synapse-motion-v2', 'Unsupported schema'
frames = data['frames']
if not frames:
    raise ValueError('No captured frames')
scene = bpy.context.scene
fps = scene.render.fps / scene.render.fps_base
collection = bpy.data.collections.new('NIKO 3D VIBES Capture')
scene.collection.children.link(collection)
objects = []
for i in range(33):
    obj = bpy.data.objects.new('Joint_%02d' % i, None)
    collection.objects.link(obj)
    obj.empty_display_type = 'SPHERE'
    obj.empty_display_size = 0.025
    objects.append(obj)
links = []
for a,b in data['bones']:
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.012, depth=1)
    obj = bpy.context.object
    for col in list(obj.users_collection): col.objects.unlink(obj)
    collection.objects.link(obj)
    obj.name = 'Link_%02d_%02d' % (a,b)
    links.append((a,b,obj))
for row in frames:
    f = 1 + row['t_ms'] * fps / 1000
    points = [Vector((p[0],-p[2],p[1])) if p is not None else None for p in row['points']]
    for i, obj in enumerate(objects):
        p = points[i]
        obj.hide_viewport = obj.hide_render = p is None
        if p is not None:
            obj.location = p
            obj.keyframe_insert(data_path='location', frame=f)
        for prop in ('hide_viewport','hide_render'): obj.keyframe_insert(data_path=prop, frame=f)
    for a,b,obj in links:
        p,q=points[a],points[b]
        valid=p is not None and q is not None and (q-p).length>1e-6
        obj.hide_viewport=obj.hide_render=not valid
        for prop in ('hide_viewport','hide_render'): obj.keyframe_insert(data_path=prop,frame=f)
        if valid:
            d=q-p
            obj.location=(p+q)/2
            obj.rotation_mode='QUATERNION'
            obj.rotation_quaternion=d.to_track_quat('Z','Y')
            obj.scale=(1,1,d.length)
            for prop in ('location','rotation_quaternion','scale'): obj.keyframe_insert(data_path=prop,frame=f)
scene.frame_end=max(scene.frame_end,math.ceil(1+frames[-1]['t_ms']*fps/1000))
scene.frame_set(1)
