function hideChildren(elemID) {
  const elem = document.getElementById(elemID);
  for (const child of elem.children) {
    child.style.visibility = 'hidden' 
  }
}

// timeout function
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

// get random int in range
// here for posterity
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// animate my signature
async function animateSignature(signatureID, durationMultiplier) {
  const signature = document.getElementById(signatureID);


  for (const child of signature.getElementsByTagName('path')) {
    child.style.visibility = 'visible'

    let signatureLen = child.getTotalLength();
    let duration = Math.floor(signatureLen * durationMultiplier)

    child.style.strokeDasharray = signatureLen + ' ' + signatureLen;
    child.style.strokeDashoffset = signatureLen;

    let animation = child.animate(
      [{strokeDashoffset: signatureLen}, {strokeDashoffset: 0}],
      {duration: duration, iterations: 1}
    )

    animation.onfinish = (event) => {
      child.style.strokeDasharray = 0;
      child.style.strokeDashoffset = 0;
    }

    await sleep(duration)
  }

  for (const child of signature.getElementsByTagName('circle')) {
    child.style.visibility = 'visible'
  }
}

// dynamically add in divs to add iframes in for spotify songs
function spotifyFrames(addBeforeID) {
  const musicDiv = document.createElement("div");
  const subHead = document.createElement("h2");
  const headText = document.createTextNode("Linked Music");

  musicDiv.id = "linked-music"

  subHead.appendChild(headText)
  musicDiv.appendChild(subHead)

  for (const link of document.links) {
    if (link.hostname.startsWith("open.spotify.com")) {
      let spotifyFrame = document.createElement("iframe");
      let songID = link.pathname.substring(link.pathname.lastIndexOf('/') + 1);

      spotifyFrame.id = "spotify:track:" + songID
      spotifyFrame.src = "https://open.spotify.com/embed/track/" + songID + "?utm_source=generator&theme=0"
      spotifyFrame.height = 152
      spotifyFrame.allowFullscreen = false
      spotifyFrame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      spotifyFrame.loading = "lazy"
      spotifyFrame.style.borderRadius = "12px"
      spotifyFrame.style.border = 0


      musicDiv.appendChild(spotifyFrame)
    }
  }

  const parent = document.getElementById(addBeforeID).parentNode;
  let child = document.getElementById(addBeforeID);

  parent.insertBefore(musicDiv, child)
}

function highlightNav() {
  for (const child of document.querySelector("nav").children) {
    let basepath = window.location.pathname.split("/")[1];
    child.classList.toggle("onpage", child.id === basepath);
  }
}

