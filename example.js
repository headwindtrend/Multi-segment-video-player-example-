javascript: (function() {

const targetVideo = "https://www.youtube.com/watch?v=SUEzksc3CXA";
const segmentsSpec = "1647-1670,12:34-13:00";
const loopFlag = false;
const playbackRate = "1.5";

let videoURL = targetVideo;
if (typeof segmentsSpec !== "undefined" && segmentsSpec)
  videoURL += "&segments=" + segmentsSpec;
if (typeof loopFlag !== "undefined" && loopFlag)
  videoURL += "&loop=1";
if (typeof playbackRate !== "undefined" && playbackRate)
  videoURL += "&speed=" + playbackRate;

var onYouTubeIframeAPIReady = async function() {
  const videoURL = window.top.localStorage.getItem("vspb_thisURL");
  const urlParams = new URLSearchParams(videoURL.split("?")[1]);
  const ytvid = urlParams.get("v");
  if (ytvid) {
    const segmentsParam = urlParams.get("segments");
    let segments;
    if (segmentsParam) {
      segments = segmentsParam.split(",").map(pair => {
        const [start, end] = pair.split("-").map(tstr => {
          if (tstr.includes(":")) {
            if (tstr.split(":").length == 2) {
              const [mm, ss] = tstr.split(":").map(Number);
              return ( mm * 60 + ss );
            } else if (tstr.split(":").length == 3) {
              const [hh, mm, ss] = tstr.split(":").map(Number);
              return ( hh * 3600 + mm * 60 + ss );
            }
          } else {
            return ( tstr );
          }
        });
        return { start, end };
      });
    } else {
      segments = [{start: 0}, {end: 99999}];
    }
    const loop = urlParams.get("loop");
    const speed = urlParams.get("speed");
    await new Promise(resolve => {
      new YT.Player("player", {
        videoId: ytvid, width: "100%", height: "100%",
        events: {
          "onReady": event => {
            event.target.playVideo();
            const d = document.querySelector("iframe").contentWindow.document;
            const v = d.querySelector("video");
            let i = 0;
            v.dataset.currentIndex = i;
            v.addEventListener("timeupdate", () => {
              if (segments[i] && v.currentTime >= segments[i].end) {
                i++;
                if (i < segments.length) {
                  v.currentTime = segments[i].start;
                } else {
                  if (loop) {
                    i = 0;
                    v.currentTime = segments[i].start;
                  } else {
                    v.pause();
                  }
                }
                v.dataset.currentIndex = i;
              }
            });
            v.addEventListener("loadedmetadata", () => {
              if (segments.length > 0) {
                v.currentTime = segments[0].start;
                if (speed) {
                  v.playbackRate = speed;
                }
              }
            });
          },
          "onStateChange": event => {
            if (event.data === YT.PlayerState.ENDED) {
              resolve();
            } else if (event.data === YT.PlayerState.PAUSED && Number(document.querySelector("iframe").contentWindow.document.querySelector("video").dataset.currentIndex) == segments.length) {
              resolve();
            }
          },
          "onError": event => {
            console.log("An error occurred:", event.data);
            resolve();
          }
        }
      });
    });
  }
};
function videoSegmentsPlayback(videoURL) {
  window.top.localStorage.setItem("vspb_thisURL", videoURL);
  window.top.localStorage.setItem("vspb_apiReady", onYouTubeIframeAPIReady.toString());
  const newTab = window.open();
  newTab.document.write(trustedTypes.createPolicy("policy_" + Math.random().toString(36).substr(2, 9), {createHTML: (string) => string}).createHTML(`
<script src="https://www.youtube.com/iframe_api"></script>
<style>html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}</style>
<body style="background: black"><div id="player"></div><script>
  var defaultScriptPolicy = trustedTypes.createPolicy( "scriptDefault", {createScript: (string) => string});
  const s = document.createElement("script");
  document.body.appendChild(s);
  s.textContent = defaultScriptPolicy.createScript(window.top.localStorage.getItem("vspb_apiReady").replace("function()", "function onYouTubeIframeAPIReady()"));
</script></body>
  `));
}
videoSegmentsPlayback(videoURL);
})();
