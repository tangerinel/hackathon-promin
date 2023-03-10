const provider = new ethers.providers.Web3Provider(ethereum);

const player = document.querySelector(".success-anim");

const btn = document.querySelector(".onboard");
const mainPageBtn = document.querySelector("#main-page");
const statusText = document.querySelector("h1");
const statusDesc = document.querySelector(".desc");
const loader = document.querySelector(".loader");
const upArrow = document.querySelector(".up");
const confetti = document.querySelector(".confetti");

let contract;

const isMetaMaskInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

let connected = (accounts) => {
  statusText.innerHTML = "Connected!";
  statusDesc.classList.add("account");
  statusDesc.innerHTML = accounts[0];
  btn.style.display = "none";
  mainPageBtn.removeAttribute("hidden");
  mainPageBtn.onclick = onMainPageBtnClick;
  loader.style.display = "none";
  upArrow.style.display = "none";
  confetti.style.display = "block";
  player.play();
};

async function connectWallet() {
  return await ethereum.request({ method: "eth_accounts" });
}
const onMainPageBtnClick = () => {
  connectWallet().then(async (accounts) => {
    if (accounts && accounts[0] > 0) {
      contract = await getContract();
      fetch("./main.html")
        .then((x) => x.text())
        .then((y) => (document.querySelector("html").innerHTML = y));

      let numberPolls = await contract.pollCounter();
      animate(true);
      let polls = await getPolls(numberPolls, accounts[0]);
      animate(false);
      polls.forEach((poll) => addPoll(poll));

      let newPollBtn = document.querySelector("#new-form-created");
      newPollBtn.addEventListener("click", () => {
        let name = document.getElementById("newPollName").value;
        let description = document.getElementById("newDescription").value;
        createPoll(contract, name, description);
      });

      const buttons = document.querySelectorAll('[data-target="#voteModal"]');
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          // Get the text to display in the modal from the button's data-text attribute

          const id = button.getAttribute("id");
          const percent = document.getElementById("perc");
          const name = document.getElementById("name");
          const desc = document.getElementById("description");
          const btnYes = document.getElementById("yes");
          const btnNo = document.getElementById("no");
          // Set the text in the modal body
          const poll = polls[id];
          name.textContent = poll.name;
          desc.textContent = poll.description;
          let quorum = (poll.votesYes / poll.totalVotes) * 100;
          percent.textContent = quorum + "%";

          //set button listeners
          btnYes.addEventListener("click", async () => {
            const tx = await contract
              .connect(provider.getSigner())
              .vote(poll.pollId, true);
            await tx.wait();
          });
          btnNo.addEventListener("click", async () => {
            const tx = await contract
              .connect(provider.getSigner())
              .vote(poll.pollId, false);
            await tx.wait();
          });
        });
      });
    }
  });
};
async function createPoll(contract, name, description) {
  const tx = await contract
    .connect(provider.getSigner())
    .createPoll(name, description);
  await tx.wait();
}

function animate(bool) {
  let row = document.querySelector("#cards-container");
  if (bool) {
    row.innerHTML =
      '<div class="onboard-container mx-auto">\n' +
      '      <div class="loader ">\n' +
      "        <lottie-player\n" +
      '          class=""' +
      '          src="https://assets6.lottiefiles.com/private_files/lf30_fup2uejx.json"\n' +
      '          background="transparent"\n' +
      '          speed="1"\n' +
      "          loop\n" +
      "          autoplay\n" +
      "        ></lottie-player>\n" +
      "      </div>";
  } else {
    row.innerHTML = "";
  }
}
async function getPolls(numberPolls, account) {
  let polls = [];
  let activePolls = 0;
  for (let i = 0; i < numberPolls; i++) {
    let poll = await getPoll(i, account);
    polls[i] = poll;
    activePolls += poll.pollIsActive;
  }
  setActivePolls(activePolls);
  return polls;
}
function setActivePolls(num) {
  document.getElementById("act-polls").textContent = num;
}
function addPoll(poll) {
  const template = cardTemplate(poll);
  let row = document.querySelector("#cards-container");
  const col = document.createElement("div");
  col.className = "col-md-4";
  col.innerHTML = template;
  row.appendChild(col);
}
function cardTemplate(poll) {
  const percYes = (poll.votesYes / poll.totalVotes) * 100;
  const percNo = (poll.votesNo / poll.totalVotes) * 100;
  const modalId = "#voteModal";
  const template = `  <div class="card">
          <div class="card-body">
            <h5 class="card-title text-left">${poll.name}</h5>
           <p class="text-left mb-1 mt-1">Yes</p>
            <div class="progress mb-1" style="height: 13px;">
                <div class="progress-bar bg-success" role="progressbar" style="width:${percYes}%" 
                 aria-valuenow="${percYes}" aria-valuemin="0" aria-valuemax="100">
                ${percYes}%</div>
              </div>
              <p class="text-left mb-1 mt-1 ">No</p>
              <div class="progress" style="height: 13px;">
                <div class="progress-bar bg-danger" role="progressbar" style="width: ${percNo}%" aria-valuenow="${percNo}" aria-valuemin="0" aria-valuemax="100">
                ${percNo}%</div>
              </div>
            <!-- <p class="card-text">Some example text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p> -->
            <button type="button" id=${poll.pollId} class="btn btn-outline-success my-2 my-sm-0  float-right" data-toggle="modal" data-target=${modalId} >Vote</button>
          </div>
        </div>
      </div>`;

  return template;
}

async function getPoll(pollId, account) {
  let poll = { pollId: pollId };
  poll.name = await contract.getName(pollId);
  poll.description = await contract.getDescription(pollId);
  poll.votesYes = await contract.getVoteYes(pollId);
  poll.votesNo = await contract.getVoteNo(pollId);
  poll.totalVotes = await contract.getTotalVotes(pollId);
  poll.author = await contract.getAuthor(pollId);
  poll.dateCreated = await contract.getDateCreated(pollId);
  poll.pollIsActive = await contract.pollIsActive(pollId);
  poll.haveVoted = await contract.haveVoted(pollId, account);
  return poll;
}
async function getContract() {
  return new ethers.Contract(
    config.contractAddress,
    config.contractABI.ABI,
    provider
  );
}

btn.addEventListener("click", async () => {
  btn.style.backgroundColor = "#cccccc";
  loader.style.display = "block";

  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    connected(accounts);
  } catch (error) {
    console.error(error);
  }
});

const MetaMaskClientCheck = () => {
  if (!isMetaMaskInstalled()) {
    statusText.innerText = "You have to Install a Wallet";
    statusDesc.innerText = "We recommend the MetaMask wallet.";
    btn.innerText = "Install MetaMask";
  } else {
    connectWallet().then((accounts) => {
      if (accounts && accounts[0] > 0) {
        connected(accounts);
      } else {
        statusText.innerHTML = "Connect your wallet";
        statusDesc.innerHTML = `To decide your fate, please connect your MetaMask wallet.`;
        btn.innerText = "Connect MetaMask";
        upArrow.style.display = "block";
      }
    });
  }
};

MetaMaskClientCheck();

// TIMER

// // Set the date you're counting down to
// let countDownDate = new Date("Mar 31, 2023 00:00:00").getTime();
//
// // Update the count down every 1 second
// let x = setInterval(function() {
//
//   // Get the current date and time
//   let now = new Date().getTime();
//
//   // Find the distance between now and the countdown date
//   let distance = countDownDate - now;
//
//   // Calculate the days, hours, minutes and seconds left
//   let days = Math.floor(distance / (1000 * 60 * 60 * 24));
//   let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//   let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
//   let seconds = Math.floor((distance % (1000 * 60)) / 1000);
//
//   // Display the countdown timer in the element with id="countdown"
//   document.getElementById("countdown").innerHTML = days + "d " + hours + "h "
//   + minutes + "m " + seconds + "s ";
//
//   // If the countdown is finished, display the message
//   if (distance < 0) {
//     clearInterval(x);
//     document.getElementById("countdown").innerHTML = "EXPIRED";
//   }
// }, 1000);
