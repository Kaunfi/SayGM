document.addEventListener("DOMContentLoaded", function () {
    const menu = document.getElementById("menu");
    const menuToggle = document.getElementById("menuToggle");

    if (menu && menuToggle) {
        menuToggle.addEventListener("click", function () {
            menu.classList.toggle("open");
            menu.style.left = menu.classList.contains("open") ? "0" : "-250px";
        });
    } else {
        console.error("Erreur : menu ou bouton menuToggle non trouvé");
    }

    document.getElementById("gmButton").disabled = true;
    document.getElementById("message").innerText = "Connect your wallet before";
    document.getElementById("message").style.display = "block";
    document.getElementById("message").style.color = "white";

    async function toggleWallet() {
        if (!window.ethereum) {
            alert("No wallet detected");
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            document.getElementById("connectButton").innerText = address.slice(0, 4) + "..." + address.slice(-4);
            document.getElementById("connectButton").setAttribute("data-connected", "true");
            document.getElementById("gmButton").disabled = false;
            document.getElementById("message").style.display = "none";

            updateGMCount();
            updateGMReceived();
        } catch (error) {
            console.error("Wallet connection failed:", error);
            alert("Wallet connection failed! Check the console for details.");
        }
    }

    document.getElementById("connectButton").addEventListener("click", function () {
        if (this.getAttribute("data-connected") === "true") {
            disconnectWallet();
        } else {
            toggleWallet();
        }
    });

    function disconnectWallet() {
        document.getElementById("connectButton").innerText = "Connect Wallet";
        document.getElementById("connectButton").setAttribute("data-connected", "false");
        document.getElementById("gmButton").disabled = true;
        document.getElementById("gmCountContainer").style.display = "none";
        document.getElementById("message").innerText = "Connect your wallet before";
        document.getElementById("message").style.color = "white";
        document.getElementById("message").style.display = "block";
    }

    async function ensureOnBaseNetwork() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();

        if (Number(network.chainId) !== 8453) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x2105' }] // 8453 en hex
                });
                return true;
            } catch (err) {
                document.getElementById("message").innerText = "Please switch to Base!";
                document.getElementById("message").style.display = "block";
                return false;
            }
        }
        return true;
    }

    async function sendGM() {
            const isConnected = document.getElementById("connectButton").getAttribute("data-connected");
            if (isConnected !== "true") {
                document.getElementById("message").innerText = "Connect your wallet before";
                document.getElementById("message").style.color = "white";
                document.getElementById("message").style.display = "block";
                return;
            }

            if (!(await ensureOnBaseNetwork())) return;

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const abi = [
                    "function sayGM() external",
                    "function sayGMTo(address to) external",
                    "function getSentCount(address user) view returns (uint256)",
                    "function getReceivedCount(address user) view returns (uint256)"
                ];

                const contract = new ethers.Contract("0x951141018898ba9406B6911620733358A5F2eDEe", abi, signer);

                const toAddress = document.getElementById("gmToAddress").value.trim();

                let tx;
                if (toAddress) {
                    tx = await contract.sayGMTo(toAddress);
                } else {
                    tx = await contract.sayGM();
                }

                await tx.wait();

                document.getElementById("message").innerText = `GM sent ${toAddress ? "to " + toAddress : "successfully"}!`;
                document.getElementById("message").style.color = "green";
                document.getElementById("message").style.display = "block";

                updateGMCount();
                updateGMReceived();
            } catch (error) {
                console.error("Transaction failed:", error);
                document.getElementById("message").innerText = "Transaction failed!";
                document.getElementById("message").style.color = "red";
                document.getElementById("message").style.display = "block";
            }
        }

    document.getElementById("gmButton").addEventListener("click", sendGM);
});

async function updateGMCount() {
    if (!window.ethereum) return;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const walletAddress = await signer.getAddress();

        const abi = [
            "function sayGM() external",
            "function getSentCount(address user) view returns (uint256)",
        ];

        const contract = new ethers.Contract("0x951141018898ba9406B6911620733358A5F2eDEe", abi, signer);
        const gmCount = await contract.getSentCount(walletAddress);

        document.getElementById("gmCount").innerText = gmCount.toString();
        document.getElementById("gmCountContainer").style.display = "block";
    } catch (error) {
        console.error("Error retrieving GM count:", error);
    }
}

async function updateGMReceived() {
    if (!window.ethereum) return;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const walletAddress = await signer.getAddress();

        const abi = [
            "function sayGM() external",
            "function getReceivedCount(address user) view returns (uint256)",
        ];

        const contract = new ethers.Contract("0x951141018898ba9406B6911620733358A5F2eDEe", abi, signer);
        const gmReceived = await contract.getReceivedCount(walletAddress);

        document.getElementById("gmReceived").innerText = gmReceived.toString();
        document.getElementById("gmCountContainer").style.display = "block";
    } catch (error) {
        console.error("Error retrieving GM received:", error);
    }
}