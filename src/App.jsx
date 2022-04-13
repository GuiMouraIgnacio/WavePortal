import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

export default function App() {
const contractABI = abi.abi;
const contractAddress = "0x60E0B97596b6C72CE23cE62855e27552C2fe0dC5"
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [allWaves, setAllWaves] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Chamou")
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  } 
  
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }
  
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  
  const getAllWaves = async () => {
    const { ethereum } = window;
  
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();
  
        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });
  
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };


  useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);
  
  const wave = async () => {
      try {
        const { ethereum } = window;
  
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

          setLoading(true);
          let count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());
  
          const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 })
          console.log("Mining...", waveTxn.hash);
  
          await waveTxn.wait();
          console.log("Mined -- ", waveTxn.hash);
  
          count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());
          setMessage("")
          setLoading(false);
        } else {
          setLoading(false);
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    }

  const changeMessage = (e) => {
    setMessage(e.target.value)
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <p className="header">
        🤙 Salve 🤙
        </p>

        <div className="bio">
        I am Cmakota, web2 developer and pixel artist diving into web3
        </div>

        
        {loading && (
          <div className="load-9">
            <div className="spinner">
              <div className="bubble-1"></div>
              <div className="bubble-2"></div>
            </div>
            <p>processing...</p>
          </div>
        )}
        

        {!loading && (!currentAccount ? (
          <button className="waveButton button" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <>
            <textarea  className="textarea  is-rounded is-warning is-medium" type="text" placeholder="Write a message..." value={message} onChange={changeMessage}/>
            <button className="waveButton button" onClick={wave}>
              Wave at Me 👋
            </button>
          </>
        ))}
        
        {allWaves.map((wave, index) => {
          return (
            <div key={index} className="card wave" >
              <div className="card-content">
                <div className="content">
                  <p className="address">{wave.address} sent:</p>
                  <p className="message"> {wave.message}</p>
                  <p className="time">{wave.timestamp.toLocaleString()}</p>
                </div>
              </div>
            </div>)
        })}
      </div>
    </div>
  );
}
