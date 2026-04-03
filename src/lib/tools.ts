import { FunctionDeclaration, Type } from "@google/genai";

export const tools: { functionDeclarations: FunctionDeclaration[] }[] = [
  {
    functionDeclarations: [
      {
        name: "searchWeb",
        description: "Search the web for a query using Google Search.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The search query.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "searchYouTube",
        description: "Search for videos or music on YouTube.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The search query for YouTube.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "searchSpotify",
        description: "Search for music on Spotify.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The search query for Spotify.",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "openWebsite",
        description: "Open a specific website by its URL or name.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: "The URL of the website to open (e.g., 'https://google.com').",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "sendWhatsAppMessage",
        description: "Send a WhatsApp message to a specific phone number.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            phoneNumber: {
              type: Type.STRING,
              description: "The phone number in international format (e.g., '919876543210').",
            },
            message: {
              type: Type.STRING,
              description: "The message to send.",
            },
          },
          required: ["phoneNumber", "message"],
        },
      },
    ],
  },
];

export const toolHandlers = {
  searchWeb: (args: { query: string }) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(args.query)}`, "_blank");
    return { status: "success", message: `Searching Google for ${args.query}` };
  },
  searchYouTube: (args: { query: string }) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`, "_blank");
    return { status: "success", message: `Searching YouTube for ${args.query}` };
  },
  searchSpotify: (args: { query: string }) => {
    window.open(`https://open.spotify.com/search/${encodeURIComponent(args.query)}`, "_blank");
    return { status: "success", message: `Searching Spotify for ${args.query}` };
  },
  openWebsite: (args: { url: string }) => {
    let targetUrl = args.url;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://${targetUrl}`;
    }
    window.open(targetUrl, "_blank");
    return { status: "success", message: `Opening ${targetUrl}` };
  },
  sendWhatsAppMessage: (args: { phoneNumber: string; message: string }) => {
    const cleanNumber = args.phoneNumber.replace(/\D/g, "");
    window.open(`https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(args.message)}`, "_blank");
    return { status: "success", message: `Opening WhatsApp to send message to ${args.phoneNumber}` };
  },
};
