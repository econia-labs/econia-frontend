import {
  Account,
  type AccountAddress,
  Aptos,
  AptosConfig,
  Bool,
  MoveString,
  MoveVector,
  Network,
  type SimpleTransaction,
  U8,
  U128,
  type Uint8,
  type Uint128,
} from "@aptos-labs/ts-sdk";

// Created with the JSON output from the
// `aptos move build-publish-payload` command.
const MODULE_METADATA = `0b436f696e466163746f7279020000000000000000403437333346413931364245364334314437303130313539414644303638413742453437333846393139464237323243323035414642373441334332453541413998021f8b08000000000002ff8590cd4ec3301084ef7e0a2b1c726a92f20f120784d427e05645d5dadec456e31fd94ea06fcf9aa6c00d9f763ecf78acdd07904718b1670e2cf2175ebd79e37620b38fa78a2d1893f18e78bd6dbaa6abd91cc6080a0fc14f469eca85b176ce2026acf9157fd7c86544a0384fdacf93e20ee915ae61419e3d971adc489336894bef72a4aa86b13d281531254c3dbbe0c3cacaafbaedf58da0737b77fff0f804422a1c0a2b9ad4eff4877ffb4a885845150a97cd7f359f02719030e03910d02974d2606a5e43f66917694b1f3e1e7b369a5c123ae7909edb96a49e4523bd6da138371388b48ed2476cc850b1884b095930ce21e9340b65624167a7f50bb6c3a5648dffe88a7d01f58a4a2daf010000010c636f696e5f666163746f72790000000300000000000000000000000000000000000000000000000000000000000000010e4170746f734672616d65776f726b00000000000000000000000000000000000000000000000000000000000000010b4170746f735374646c696200000000000000000000000000000000000000000000000000000000000000010a4d6f76655374646c696200`;
const MODULE_BYTECODE = `a11ceb0b060000000b01000802082003283904610e056f7407e301ec0108cf0340068f045210e104a1010a8206050c87068501000001010102010300040000010705010001010805010001010905010001010a04010001030c07000005000100020b030400030d050600010e08090100010f0301010001100a0b010001110c01010001120d01010001130e01010001140f010100030704070507060707070807090706060c0a020a0202010400060b010108000b020108000b030108000b040108000b040108000401060c0105010a0201080501080005060c080508050201030b010109000b020109000b030109000203060b03010900010b0401090002050b04010900010b02010900010b03010900010b010109000c636f696e5f666163746f727904636f696e067369676e657206737472696e670a436f696e537472756374136d696e745f696e697469616c5f737570706c790b64756d6d795f6669656c640e4275726e4361706162696c69747910467265657a654361706162696c6974790e4d696e744361706162696c69747904436f696e0a616464726573735f6f6606537472696e6704757466380a696e697469616c697a65087265676973746572046d696e74076465706f7369741264657374726f795f667265657a655f6361701064657374726f795f6d696e745f6361701064657374726f795f6275726e5f6361700123bbbb456789abcdef01234567abc1234567abcdef0123456789abcbbbbdef000000000000000000000000000000000000000000000000000000000000000103080000000000000000030801000000000000000308ffffffffffffffff0410ffffffffffffffff000000000000000005200123bbbb456789abcdef01234567abc1234567abcdef0123456789abcbbbbdef126170746f733a3a6d657461646174615f76318c0102000000000000000010455f434f4e54524143545f4552524f522c54686572652077617320612067656e6572616c206572726f7220776974682074686520636f6e74726163742e01000000000000000f455f4e4f545f5055424c49534845522a596f7520617265206e6f7420746865207075626c6973686572206f662074686520636f6e74726163742e000000020106010001040002450a0011010704210406050a0b00010701270a000b0111020b0211020b030b0438000c080c070c060b050c0b070207033421041d05210b00010700270a0038010a0b0703240435052807020e0838020c090a0011010b0938030b0b0703170c0b05230b0b340e0838020c0a0b0011010b0a38030b0738040b0838050b0638060200`;

// From the `contract_address` address field in `Move.toml`.
const PUBLISHER_ADDRESS =
  "0123bbbb456789abcdef01234567abc1234567abcdef0123456789abcbbbbdef";

/**
 * Converts a TypeScript string to a Serializable MoveVector<U8>
 * representation.
 * 
 * @param s
 * @returns the Serializable Move class representing a vector<u8> b"string"
 * where s == "string"
 * @example
 * // in Move.
 * let byte_vector: vector<u8> = b"Coin";
 * assert!(byte_vector == vector<u8> [67, 111, 105, 110], 0);
 * 
 * // in TypeScript.
 * const byteVector = stringToVectorU8("Coin").toUint8Array();
 * expect(byteVector == Uint8Array.from([67, 111, 105, 110]));
 */
export function stringToVectorU8(s: string): MoveVector<U8> {
  // Remove the first byte (the length) so we're just passing the raw
  // hexified string bytes to the vector<u8>.
  const stringBytes = new MoveString(s).bcsToBytes().slice(1);
  // Pass the bytes to the MoveVector<U8> constructor.
  return MoveVector.U8(stringBytes);
}

async function mintInitialSupply(
  aptos: Aptos,
  accountAddress: AccountAddress,
  name: string,
  symbol: string,
  decimals: Uint8,
  monitorSupply: boolean,
  mintedSupply: Uint128,
): Promise<SimpleTransaction> {
  return await aptos.transaction.build.simple({
    sender: accountAddress,
    data: {
      function: `${accountAddress}::coin_factory::mint_initial_supply`,
      functionArguments: [
        stringToVectorU8(name),
        stringToVectorU8(symbol),
        new U8(decimals),
        new Bool(monitorSupply),
        new U128(mintedSupply),
      ],
    },
  });
}

async function main() {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);

  const newAccount = Account.generate();

  await aptos.fundAccount({
    accountAddress: newAccount.accountAddress,
    amount: 10_000_000_000,
  });

  const publishAddress = newAccount.accountAddress;
  const addrAsString = publishAddress.bcsToHex().toStringWithoutPrefix();
  const bytecode = MODULE_BYTECODE.replaceAll(PUBLISHER_ADDRESS, addrAsString);

  const publishPackageTx = await aptos.publishPackageTransaction({
    account: newAccount.accountAddress,
    metadataBytes: MODULE_METADATA,
    moduleBytecode: [bytecode],
  });

  const publishTx = await aptos.signAndSubmitTransaction({
    signer: newAccount,
    transaction: publishPackageTx,
  });

  await aptos.waitForTransaction({
    transactionHash: publishTx.hash,
  });

  const mintInitialSupplyTx = await mintInitialSupply(
    aptos,
    newAccount.accountAddress,
    "CoinFactory",
    "Symbol",
    6,
    false,
    123987511239232491n,
  );

  const mintTx = await aptos.signAndSubmitTransaction({
    signer: newAccount,
    transaction: mintInitialSupplyTx,
  });

  const mintResponse = await aptos.waitForTransaction({
    transactionHash: mintTx.hash,
  });

  /* eslint-disable-next-line no-console */
  console.debug(mintResponse);
}

main().catch(console.error);
