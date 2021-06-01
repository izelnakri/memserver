export default function MemserverResponse(statusCode?: number, data?: {}, headers?: {}): (string | number | {
    "Content-Type": string;
})[];
