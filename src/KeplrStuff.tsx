import { FileCopyOutlined } from "@mui/icons-material";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Else, If, Then } from "react-if";
import { Breakpoint } from "react-socks";
import { SecretNetworkClient } from "secretjs";
import { chains } from "./config";

const SECRET_CHAIN_ID = chains["Secret Network"].chain_id;
const SECRET_LCD = chains["Secret Network"].lcd;

declare global {
  interface Window {
    leap: any;
  }
}

export function KeplrPanel({
  secretjs,
  setSecretjs,
  secretAddress,
  setSecretAddress,
}: {
  secretjs: SecretNetworkClient | null;
  setSecretjs: React.Dispatch<React.SetStateAction<SecretNetworkClient | null>>;
  secretAddress: string;
  setSecretAddress: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // useEffect(() => {
  //   setupLeap(setSecretjs, setSecretAddress);
  // }, []);

  const content = (
    <div style={{ display: "flex", placeItems: "center", borderRadius: 10 }}>
      <Breakpoint small down style={{ display: "flex" }}>
        <img
          src="https://assets.leapwallet.io/leap/cosmos.svg"
          style={{ width: "1.8rem", borderRadius: 10 }}
        />
      </Breakpoint>
      <Breakpoint medium up style={{ display: "flex" }}>
        <img
          src="https://assets.leapwallet.io/leap/cosmos.svg"
          style={{ width: "1.8rem", borderRadius: 10 }}
        />
      </Breakpoint>
      <span style={{ margin: "0 0.3rem" }}>
        <If condition={secretAddress.length > 0}>
          <Then>
            <Breakpoint small down>{`${secretAddress.slice(
              0,
              10
            )}...${secretAddress.slice(-7)}`}</Breakpoint>
            <Breakpoint medium up>
              {secretAddress}
            </Breakpoint>
          </Then>
          <Else>Connect wallet</Else>
        </If>
      </span>
    </div>
  );

  if (secretjs) {
    return (
      <CopyToClipboard
        text={secretAddress}
        onCopy={() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 3000);
        }}
      >
        <Button
          variant="contained"
          style={{
            background: "white",
            textTransform: "none",
            color: "black",
          }}
        >
          {content}{" "}
          <FileCopyOutlined
            fontSize="small"
            style={isCopied ? { fill: "green" } : undefined}
          />
        </Button>
      </CopyToClipboard>
    );
  } else {
    return (
      <Button
        id="keplr-button"
        variant="contained"
        style={{ background: "white", color: "black" }}
        onClick={() => setupLeap(setSecretjs, setSecretAddress)}
      >
        {content}
      </Button>
    );
  }
}

async function setupLeap(
  setSecretjs: React.Dispatch<React.SetStateAction<SecretNetworkClient | null>>,
  setSecretAddress: React.Dispatch<React.SetStateAction<string>>
) {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  while (
    !window.leap ||
    !window.leap.getEnigmaUtils ||
    !window.leap.getOfflineSignerOnlyAmino
  ) {
    await sleep(50);
  }

  await window.leap.enable(SECRET_CHAIN_ID);
  window.leap.defaultOptions = {
    sign: {
      preferNoSetFee: false,
      disableBalanceCheck: true,
    },
  };

  const keplrOfflineSigner =
    window.leap.getOfflineSignerOnlyAmino(SECRET_CHAIN_ID);
  const accounts = await keplrOfflineSigner.getAccounts();

  const secretAddress = accounts[0].address;

  const secretjs = new SecretNetworkClient({
    url: SECRET_LCD,
    chainId: SECRET_CHAIN_ID,
    wallet: keplrOfflineSigner,
    walletAddress: secretAddress,
    encryptionUtils: window.leap.getEnigmaUtils(SECRET_CHAIN_ID),
  });

  setSecretAddress(secretAddress);
  setSecretjs(secretjs);
}

export async function setLeapViewingKey(token: string) {
  if (!window.leap) {
    console.error("Keplr not present");
    return;
  }

  await window.leap.suggestToken(SECRET_CHAIN_ID, token);
}

export async function getLeapViewingKey(token: string): Promise<string | null> {
  if (!window.leap) {
    console.error("Keplr not present");
    return null;
  }
  try {
    console.log(SECRET_CHAIN_ID, token);
    const key = await window.leap.getSecret20ViewingKey(SECRET_CHAIN_ID, token);
    console.log(key);
    return key;
  } catch (e) {
    console.log(e);
    return null;
  }
}
