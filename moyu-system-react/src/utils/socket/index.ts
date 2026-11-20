import { Transport } from "./transport";
import { Protocol } from "./protocol";
import { Business } from "./business";
import type { SocketConfig } from "./types";

export function createSocket() {
  const transport = new Transport();
  const protocol = new Protocol(transport);
  // Business registers handlers via constructor side effects
  const _business = new Business(protocol);
  void _business;

  return {
    init: (cfg: SocketConfig) => transport.init(cfg),
    send: transport.send,
  };
}

const Socket = createSocket();

export default Socket;
