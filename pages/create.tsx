import React, { FormEvent, useState } from "react";
import Header from "../components/Header";
import {
  useAddress,
  useContract,
  MediaRenderer,
  useNetwork,
  useNetworkMismatch,
  useOwnedNFTs,
  useCreateAuctionListing,
  useCreateDirectListing,
} from "@thirdweb-dev/react";
import Router, { useRouter } from "next/router";
import {
  ChainId,
  NFT,
  NATIVE_TOKENS,
  NATIVE_TOKEN_ADDRESS,
} from "@thirdweb-dev/sdk";
import { SwitchChainError } from "wagmi-core";
import network from "../utils/network";
import toast, { Toaster } from "react-hot-toast";

type Props = {};

function Create({}: Props) {
  const address = useAddress();
  const router = useRouter();
  const { contract } = useContract(
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT,
    "marketplace"
  );

  const [selectedNft, setSelectedNft] = useState<NFT>();

  const { contract: collectionContract } = useContract(
    process.env.NEXT_PUBLIC_COLLECTION_CONTRACT,
    "nft-collection"
  );

  const ownedNfts = useOwnedNFTs(collectionContract, address);

  const networkMismatch = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();

  const {
    mutate: createDirectListing,
    isLoading,
    error,
  } = useCreateDirectListing(contract);

  const {
    mutate: createAuctionListing,
    isLoading: isLoadingDirect,
    error: errorDirect,
  } = useCreateAuctionListing(contract);
  // This function gets called when the form is submitted.
  // The user has provided:
  // - contract address,
  // - toked id,
  // - type of listing (direct || auction)
  // - price of the NFT
  // This function gets called when the form is submitted.

  const handleCreateListing = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (networkMismatch) {
      switchNetwork && switchNetwork(network);
      return;
    }

    if (!selectedNft) return;

    const target = e.target as typeof e.target & {
      elements: { listingType: { value: string }; price: { value: string } };
    };

    const { listingType, price } = target.elements;

    toast.loading("Listing new item...");

    if (listingType.value === "directListing") {
      createDirectListing(
        {
          assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
          tokenId: selectedNft.metadata.id,
          currencyContractAddress: NATIVE_TOKEN_ADDRESS,
          listingDurationInSeconds: 60 * 60 * 24 * 7,
          quantity: 1,
          buyoutPricePerToken: price.value,
          startTimestamp: new Date(),
        },
        {
          onSuccess(data, variables, context) {
            toast.dismiss();
            toast.success("Item has been listed");
            setTimeout(() => {
              router.push("/");
            }, 1500);
          },
          onError(error, variables, context) {
            toast.dismiss();
            toast.error("Item has not been listed");
          },
        }
      );
    }

    if (listingType.value === "auctionListing") {
      createAuctionListing(
        {
          assetContractAddress: process.env.NEXT_PUBLIC_COLLECTION_CONTRACT!,
          buyoutPricePerToken: price.value,
          tokenId: selectedNft.metadata.id,
          startTimestamp: new Date(),
          currencyContractAddress: NATIVE_TOKEN_ADDRESS,
          listingDurationInSeconds: 60 * 60 * 24 * 7,
          quantity: 1,
          reservePricePerToken: 0,
        },
        {
          onSuccess(data, variables, context) {
            toast.dismiss();
            toast.success("Item has been added");
            setTimeout(() => {
              router.push("/");
            }, 1500);
          },
          onError(error, variables, context) {
            toast.dismiss();
            toast.error("Item has not been added");
          },
        }
      );
    }
  };

  return (
    <div>
      <Header />

      <main className="max-w-6xl mx-auto p-10 pt-2">
        <Toaster />
        <h1 className="text-4xl font-bold">List an Item</h1>
        <h2 className="text-xl font-semibold pt-5 pb-2">
          Select an Item you would like to Sell
        </h2>

        <hr className="mb-5" />

        <p>Below you will find the NFT's you own in your wallet</p>

        <div className="flex overflow-x-scroll space-x-5 p-4">
          {ownedNfts?.data?.map((nft) => (
            <div
              onClick={() => setSelectedNft(nft)}
              className={`flex flex-col space-y-2 card min-w-fill max-w-sm border-2 bg-gray-100 ${
                nft.metadata.id === selectedNft?.metadata.id
                  ? "border-base"
                  : "border-transparent"
              }`}
              key={nft.metadata.id}
            >
              <MediaRenderer
                className="h-48 rounded-lg"
                src={nft.metadata.image}
              />
              <p className="text-lg truncate font-bold">{nft.metadata.name}</p>
              <p className="text-xs truncate">{nft.metadata.description}</p>
            </div>
          ))}
        </div>

        {selectedNft && (
          <form onSubmit={handleCreateListing}>
            <div className="flex flex-col p-10">
              <div className="grid grid-cols-2 gap-5">
                <label className="border-r font-light">
                  Direct Listing / Fixed Price
                </label>
                <input
                  type="radio"
                  name="listingType"
                  value="directListing"
                  className="ml-auto h-10 w-10"
                />
                <label className="border-r font-light">Auction</label>
                <input
                  type="radio"
                  name="listingType"
                  value="auctionListing"
                  className="ml-auto h-10 w-10"
                />

                <label className="border-r font-light">Price</label>
                <input
                  placeholder="0.05"
                  type="text"
                  name="price"
                  className="bg-gray-100 p-5 rounded-lg"
                />
              </div>
              <button className="bg-base text-white rounded-lg p-4 mt-8">
                Create a Listing
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default Create;
