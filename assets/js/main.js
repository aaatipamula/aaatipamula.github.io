// Used to hide children on load
function hideChildren(elemID) {
  const elem = document.getElementById(elemID);
  for (const child of elem.children) {
    child.style.visibility = 'hidden' 
  }
}

// timeout function
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

// get random int in range (unused currently)
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
    let duration = Math.floor(signatureLen * durationMultiplier);

    child.style.strokeDasharray = signatureLen + ' ' + signatureLen;
    child.style.strokeDashoffset = signatureLen;

    let animation = child.animate(
      [{strokeDashoffset: signatureLen}, {strokeDashoffset: 0}],
      {duration: duration, iterations: 1}
    );

    animation.onfinish = () => {
      child.style.strokeDasharray = 0;
      child.style.strokeDashoffset = 0;
    }

    await sleep(duration);
  }

  signature.querySelector('circle').style.visibility = 'visible';
}

// dynamically add in divs to add iframes in for spotify songs
async function spotifyFrames(addBeforeID) {
  const musicDiv = document.createElement("div");
  const carousel = document.createElement("div");
  const subHead = document.createElement("h2");

  musicDiv.id = "linked-music";
  carousel.classList.add("carousel-container");
  subHead.innerText = "Linked Music";

  let back = document.createElement('i');
  back.classList.add("fa-solid", "fa-arrow-left", "fa-xl", "carousel-control");
  back.id = "carousel-back";

  let forward = document.createElement('i');
  forward.classList.add("fa-solid", "fa-arrow-right", "fa-xl", "carousel-control");
  forward.id = "carousel-forward";

  let child = document.getElementById(addBeforeID);
  child.parentNode.insertBefore(musicDiv, child);

  musicDiv.appendChild(subHead);
  musicDiv.appendChild(back);
  musicDiv.appendChild(forward);
  musicDiv.appendChild(carousel);

  let itemCount = 0;
  const carouselItems = []

  for (const link of document.links) {
    if (link.hostname.startsWith("open.spotify.com")) {
      let res = await fetch("https://open.spotify.com/oembed?url=" + link);
      let songInfo = await res.json();

      let card = document.createElement("div");
      card.classList.add("carousel-item");

      let thumbnail = new Image(songInfo.thumbnail_width, songInfo.thumbnail_height);
      thumbnail.src = songInfo.thumbnail_url;
      thumbnail.style.borderRadius = ".25rem"

      let text = document.createTextNode(songInfo.title)

      card.appendChild(thumbnail);
      card.appendChild(text);
      
      carousel.appendChild(card);
      carouselItems.push(card);
      itemCount++;
    }
  }

  // Assumes constant size for all elements
  let itemWidth = carousel.firstChild.getBoundingClientRect().width + 20;
  let currentIndex = Math.floor(itemCount/2);
  let offsetWidth = (currentIndex) * itemWidth;

  carouselItems[currentIndex].classList.toggle("carousel-active")

  function goToIndex(index) {
    if (index < 0) {
      index = itemCount - 1;
    } else if (index >= itemCount) {
      index = 0; 
    }

    carouselItems[currentIndex].classList.toggle("carousel-active")
    carouselItems[index].classList.toggle("carousel-active")

    carousel.style.transform = `translateX(${-(index * itemWidth) + offsetWidth}px)`;
    currentIndex = index;
  }

  back.addEventListener("click", () => goToIndex(currentIndex - 1));
  forward.addEventListener("click", () => goToIndex(currentIndex + 1));
}

function highlightNav() {
  for (const child of document.querySelector("nav").children) {
    let basepath = window.location.pathname.split("/")[1];
    child.classList.toggle("onpage", child.id === basepath);
  }
}

