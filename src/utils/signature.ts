import * as jsrsasign from 'jsrsasign';

export function generateZoomSignature(
  clientId: string,
  clientSecret: string,
  meetingNumber: string,
  role: 0 | 1 = 0
): string {
  const iat = Math.round(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;

  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify({
    sdkKey: clientId,
    appKey: clientId,
    mn: meetingNumber,
    role,
    iat,
    exp,
    tokenExp: exp,
  });

  // jsrsasign types are incomplete; cast to access JWS
  const kjur = jsrsasign as unknown as { KJUR: { jws: { JWS: { sign: (alg: string, h: string, p: string, k: string) => string } } } };
  return kjur.KJUR.jws.JWS.sign('HS256', header, payload, clientSecret);
}
