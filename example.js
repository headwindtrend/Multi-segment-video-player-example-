function parseSegmentsFromUrl(videoUrl) {
  const urlParams = new URLSearchParams(videoUrl.split('?')[1]);
  const segmentsParam = urlParams.get('segments');
  if (!segmentsParam) return [];

  const segments = segmentsParam.split(',').map(pair => {
    const [start, end] = pair.split('-').map(Number);
    return { start, end };
  });

  return segments;
}
function createVideoElement(videoUrl) {
  const segments = parseSegmentsFromUrl(videoUrl);
  const videoElement = document.createElement('video');
  videoElement.setAttribute('controls', 'controls');
  videoElement.width = 640;
  videoElement.height = 360;

  const sourceElement = document.createElement('source');
  sourceElement.src = videoUrl.split('?')[0];
  sourceElement.type = 'video/mp4';

  videoElement.appendChild(sourceElement);
  document.body.insertBefore(videoElement, document.body.firstChild);

  let currentSegmentIndex = 0;

  videoElement.addEventListener('timeupdate', () => {
    if (segments[currentSegmentIndex] && videoElement.currentTime >= segments[currentSegmentIndex].end) {
      currentSegmentIndex++;
      if (currentSegmentIndex < segments.length) {
        videoElement.currentTime = segments[currentSegmentIndex].start;
        videoElement.play();
      } else {
        videoElement.pause();
      }
    }
  });

  videoElement.addEventListener('loadedmetadata', () => {
    if (segments.length > 0) {
      videoElement.currentTime = segments[0].start;
      videoElement.play();
    }
  });
}

const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4?segments=5-10,3-7,0-4';

createVideoElement(videoUrl);
