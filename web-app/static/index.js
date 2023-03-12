//import MetaMaskOnboarding from "metamask-onboarding";

// const ethers = require('ethers');


const provider = new ethers.providers.Web3Provider(ethereum);

const player = document.querySelector(".success-anim");

// const onboarding = new MetaMaskOnboarding();
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
  mainPageBtn.onclick =  onMainPageBtnClick;
  loader.style.display = "none";
  upArrow.style.display = "none";
  confetti.style.display = "block";
  player.play();
};

async function connectWallet() {
  return await ethereum.request({ method: "eth_accounts" });
}
const onMainPageBtnClick = ()=>{
 connectWallet().then(async (accounts) => {
   if (accounts && accounts[0] > 0) {
     contract = getContract();
     fetch("./main.html")
         .then((x) => x.text())
         .then((y) => (document.querySelector("html").innerHTML = y));

     let numberPolls = await contract.pollCounter();
     animate(true);
     let polls = await getPolls(numberPolls, accounts[0]);
     animate(false);
     polls.forEach(poll => addPoll(poll));

     let newPollBtn = document.querySelector("#new-form-created");
     newPollBtn.addEventListener('click', ()=>{
       let name = document.getElementById("newPollName").value;
       let decription =  document.getElementById("newDescription").value;
       createPoll(contract, name, decription);
     })

   // let numPolls = a;
   }});
}
async function createPoll(contract, name, description){
  const tx = await contract.connect(provider.getSigner()).createPoll(name, description);
  await tx.wait();
}
function createModal(poll) {
  let id = "#voteModal"+poll.pollId;
  let container = document.querySelector(".container");
  let modal = document.createElement('div');
  modal.className = "modal fade";
  modal.id = id;
  modal.tabIndex = -1;
  modal.role="dialog";
  modal.setAttribute("aria-labelledby","voteModalLabel");
  modal.setAttribute("aria-hidden",'true');

  modal.innerHTML = `
      <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="voteModalLabel">${poll.name}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div class="modal-body">
                    <p>Are you sure you want to vote for this card?</p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary">Vote</button>
                  </div>
                </div>
              </div>`

  container.appendChild(modal);
}
function animate(bool){
  let row = document.querySelector("#cards-container");
  if (bool){
    row.innerHTML = "<div class=\"onboard-container mx-auto\">\n" +
        "      <div class=\"loader \">\n" +
        "        <lottie-player\n" +
        "          class=\"\"" +
        "          src=\"https://assets6.lottiefiles.com/private_files/lf30_fup2uejx.json\"\n" +
        "          background=\"transparent\"\n" +
        "          speed=\"1\"\n" +
        "          loop\n" +
        "          autoplay\n" +
        "        ></lottie-player>\n" +
        "      </div>";
  }else{
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
function setActivePolls(num){
  document.getElementById("act-polls").textContent=num;
}
function addPoll(poll){
  const template = cardTemplate(poll);
  let row = document.querySelector("#cards-container");
  const col = document.createElement('div');
  col.className = "col-md-4";
  col.innerHTML = template;
  row.appendChild(col);
  // createModal(poll);
}
function cardTemplate(poll){
  const percYes = (poll.votesYes/poll.totalVotes)*100;
  const percNo = (poll.votesNo/poll.totalVotes)*100;
  const modalId = "#voteModal"+poll.pollId;
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
            <button type="button" class="btn btn-outline-info  float-right" data-toggle="modal" data-target=${modalId} >Vote</button>
          </div>
        </div>
      </div>`

  return template;
}
// const onClickInstallMetaMask = () => {
//   onboarding.startOnboarding();
//   loader.style.display = "block";
// };
async function getPoll(pollId, account) {
  let poll = {pollId: pollId};
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
<<<<<<< HEAD
async function getContract (){
=======
function getContract (){
  const provider = new ethers.getDefaultProvider("goerli");
>>>>>>> f624e7d (deleted pagination)
  return  new ethers.Contract(config.contractAddress, config.contractABI.ABI, provider);
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
    // btn.onclick = onClickInstallMetaMask;
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
