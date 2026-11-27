// Shared MediaPipe initialization; no frame is sent to any remote service.
const CDN='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
export async function createVision(){
 const {FilesetResolver,HandLandmarker,PoseLandmarker}=await import(CDN+'/+esm');
 const files=await FilesetResolver.forVisionTasks(CDN+'/wasm'),root='https://storage.googleapis.com/mediapipe-models/';let h,p;
 try {h=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:root+'hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:2});p=await PoseLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:root+'pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.6,minTrackingConfidence:.6});return {h,p};}catch(e){h?.close();p?.close();throw e;}
}
export function detect(models,frame,t){const hand=models.h.detectForVideo(frame,t),pose=models.p.detectForVideo(frame,t);return {hands:hand.landmarks||[],labels:(hand.handedness||hand.handednesses||[]).map(x=>x[0]?.categoryName||''),poses:pose.landmarks||[],world:pose.worldLandmarks?.[0]};}
