import http from "node:http";
import { responseCodes, type ReqType } from "./response_code.js";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuthApiKey {
  api_id: string;
}

interface AuthCredentials {
  login: string;
  password: string;
}

type AuthParams = AuthApiKey | AuthCredentials;

export interface SmsSendOptions {
  to?: string;
  text?: string;
  from?: string;
  time?: number;
  translit?: boolean;
  test?: boolean;
  partner_id?: string;
  multi?: [string, string][];
}

export interface SmsCostOptions {
  to: string;
  text: string;
}

export interface StoplistEntry {
  phone: string;
  text?: string;
}

export interface SmsRuResponse {
  code: string;
  description?: string;
  [key: string]: unknown;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MAX_SCHEDULED_SECONDS = 7 * 24 * 60 * 60; // 7 days

function buildQueryString(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

function parseResponse(
  raw: string,
  category: ReqType,
  propertyNames?: string | string[],
): SmsRuResponse {
  const lines = raw.replace(/\n+$/, "").split("\n");
  const code = lines[0];

  const response: SmsRuResponse = {
    code,
    description: responseCodes[category]?.[Number(code)],
  };

  const remaining = lines.slice(1);

  if (typeof propertyNames === "string") {
    // collect all remaining lines into an array (e.g. "senders", "stoplist")
    response[propertyNames] = [];
  }

  for (const line of remaining) {
    if (line.includes("=")) {
      const [key, ...rest] = line.split("=");
      response[key] = rest.join("=");
    } else if (typeof propertyNames === "string") {
      (response[propertyNames] as string[]).push(line);
    } else if (Array.isArray(propertyNames) && propertyNames.length > 0) {
      response[propertyNames.shift()!] = line;
    }
  }

  return response;
}

// ── Client class ───────────────────────────────────────────────────────────────

export class SmsRu {
  private readonly auth: AuthParams;

  /**
   * Authenticate with an API key:
   *   new SmsRu("your-api-key")
   *
   * Or with login + password:
   *   new SmsRu("login", "password")
   */
  constructor(apiId: string);
  constructor(login: string, password: string);
  constructor(first: string, second?: string) {
    this.auth = second
      ? { login: first, password: second }
      : { api_id: first };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async smsSend(options: SmsSendOptions): Promise<SmsRuResponse> {
    const params: Record<string, string | number> = {};

    if (options.multi) {
      for (const [phone, message] of options.multi) {
        params[`multi[${phone}]`] = message;
      }
    }

    if (options.from) params.from = options.from;
    if (options.to) params.to = options.to;
    if (options.text) params.text = options.text;

    if (
      options.time &&
      options.time < Math.ceil(Date.now() / 1000) + MAX_SCHEDULED_SECONDS
    ) {
      params.time = options.time;
    }

    if (options.translit) params.translit = 1;
    if (options.test) params.test = 1;
    if (options.partner_id) params.partner_id = options.partner_id;

    return this.request("sms/send", params, ["ids"]);
  }

  async smsStatus(id: string): Promise<SmsRuResponse> {
    return this.request("sms/status", { id });
  }

  async smsCost(options: SmsCostOptions): Promise<SmsRuResponse> {
    return this.request("sms/cost", { ...options }, ["price", "number"]);
  }

  async myBalance(): Promise<SmsRuResponse> {
    return this.request("my/balance", {}, ["balance"]);
  }

  async myLimit(): Promise<SmsRuResponse> {
    return this.request("my/limit", {}, ["total", "current"]);
  }

  async mySenders(): Promise<SmsRuResponse> {
    return this.request("my/senders", {}, "senders");
  }

  async stoplistAdd(entry: StoplistEntry): Promise<SmsRuResponse> {
    return this.request("stoplist/add", {
      stoplist_phone: entry.phone,
      ...(entry.text ? { stoplist_text: entry.text } : {}),
    });
  }

  async stoplistDel(phone: string): Promise<SmsRuResponse> {
    return this.request("stoplist/del", { stoplist_phone: phone });
  }

  async stoplistGet(): Promise<SmsRuResponse> {
    return this.request("stoplist/get", {}, "stoplist");
  }

  async smsUcs(): Promise<SmsRuResponse> {
    return this.request("sms/ucs", {});
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private async request(
    path: string,
    params: Record<string, string | number>,
    propertyNames?: string | string[],
  ): Promise<SmsRuResponse> {
    const merged: Record<string, string | number> = {
      ...params,
      ...this.auth,
    };

    const url = `http://sms.ru/${path}?${buildQueryString(merged)}`;
    const raw = await httpGet(url);
    const category = path.split("/")[1] as ReqType;

    return parseResponse(
      raw,
      category,
      // clone the array so shift() in parseResponse doesn't mutate the caller's data
      Array.isArray(propertyNames) ? [...propertyNames] : propertyNames,
    );
  }
}

export default SmsRu;
