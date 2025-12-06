import { GiftSearchClient } from "./GiftSearchClient";

export default function GiftsSearchPage() {
  // TODO: based on query param and user auth we will fetch the recipient info for the gift recipient
  // basic stuff like their name so we can render "You are getting a gift for [NAME]!"
  // TODO you may or may not know them well, they mentioned they like: ..., ...

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black px-4">
      <div className="w-full max-w-2xl">
        <GiftSearchClient />
      </div>
    </div>
  );
}
