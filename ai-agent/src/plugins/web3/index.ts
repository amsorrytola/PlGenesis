import { Plugin } from "@elizaos/core";
import { MintRequestAction } from "./actions/mintRequest.ts";

export const web3Plugin: Plugin = {
  name: "web3",
  description: "Web3 plugin for interacting with EVM chains",
  actions: [MintRequestAction],
  providers: [],
};