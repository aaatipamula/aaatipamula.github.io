// General purpose function to hide element children
function hideChildren(elemID) {
  const elem = document.getElementById(elemID);
  for (const child of elem.children) {
    child.style.visibility = 'hidden' 
  }
}

// Timeout function
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

// Get random int in range (unused currently)
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Animate my signature
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

// Dynamically add a card carousel and iframe for all the Spotify links that exist
async function spotifyFrames(addBeforeID) {
  // Create all of our DOM elments 
  const musicDiv = document.createElement("div");
  const carousel = document.createElement("div");
  const subHead = document.createElement("h2");

  musicDiv.id = "linked-music";
  carousel.classList.add("carousel-container");
  subHead.innerText = "Linked Music";

  let controlSpan = document.createElement("span");
  controlSpan.classList.add("control-container")

  let back = document.createElement('i');
  back.classList.add("fa-solid", "fa-arrow-left", "fa-xl", "carousel-control");
  back.id = "carousel-back";
  controlSpan.appendChild(back)

  let forward = document.createElement('i');
  forward.classList.add("fa-solid", "fa-arrow-right", "fa-xl", "carousel-control");
  forward.id = "carousel-forward";
  controlSpan.appendChild(forward)

  let child = document.getElementById(addBeforeID);
  child.parentNode.insertBefore(subHead, child);
  child.parentNode.insertBefore(musicDiv, child);

  let frame = document.createElement("iframe");
  frame.height = 152;
  frame.allowFullscreen = false;
  frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  frame.loading = "lazy";
 
  musicDiv.appendChild(controlSpan);
  musicDiv.appendChild(carousel);
  musicDiv.appendChild(frame)

  let itemCount = 0;
  const carouselItems = []

  // Populate the carousel with cards 
  for (const link of document.links) {
    if (link.hostname.startsWith("open.spotify.com")) {
      var songID = link.pathname.substring(link.pathname.lastIndexOf('/') + 1);
      let res = await fetch("https://open.spotify.com/oembed?url=" + link, {mode: "cors"});
      let songInfo = await res.json();

      let card = document.createElement("div");
      card.classList.add("carousel-item");
      card.id = "spotify:song:" + songID

      let thumbnail = new Image(songInfo.thumbnail_width, songInfo.thumbnail_height);
      thumbnail.src = songInfo.thumbnail_url;
      thumbnail.alt = songInfo.title;
      thumbnail.classList.add("thumbnail-art")

      card.appendChild(thumbnail);
      
      carousel.appendChild(card);
      carouselItems.push(card);
      itemCount++;
    }
  }

  carouselItems[carouselItems.length - 1].style.marginRight = "0px";

  // Assumes constant size for all elements (refer to ext.sass for margin size)
  // TODO: Work on changing this to be a little more dynamic
  let itemWidth = carousel.firstChild.getBoundingClientRect().width + 20;
  let currentIndex = Math.floor(itemCount/2);
  let offsetWidth = currentIndex * itemWidth;

  // There is a slightly different offset when there are an even number of cards
  if (itemCount % 2 === 0) {
    carousel.style.transform = `translateX(${-itemWidth/2}px)`;
    offsetWidth -= itemWidth/2;
  }

  // Reload our iframe based off what index we are at
  function loadFrame(index) {
    let tag = carouselItems[index].id;
    songID = tag.split(":")[2];
    frame.src = "https://open.spotify.com/embed/track/" + songID + "?utm_source=generator&theme=0";
  }

  // Go to a specific carousel card
  function goToIndex(index) {
    if (index < 0) {
      index = itemCount - 1;
    } else if (index >= itemCount) {
      index = 0; 
    }

    loadFrame(index);

    carouselItems[currentIndex].classList.toggle("carousel-active");
    carouselItems[index].classList.toggle("carousel-active");

    carousel.style.transform = `translateX(${-(index * itemWidth) + offsetWidth}px)`;
    currentIndex = index;
  }

  // Initial load
  carouselItems[currentIndex].classList.toggle("carousel-active")
  loadFrame(currentIndex)

  // Make the forward/back elements and carousel card clickable
  back.addEventListener("click", () => goToIndex(currentIndex - 1));
  for (let i = 0; i < itemCount; i++) {
    carouselItems[i].addEventListener("click", () => goToIndex(i));
  }
  forward.addEventListener("click", () => goToIndex(currentIndex + 1));

}

function highlightNav() {
  for (const child of document.querySelector("nav").children) {
    let basepath = window.location.pathname.split("/").at(-1);
    child.classList.toggle("onpage", child.id === basepath);
  }
}

