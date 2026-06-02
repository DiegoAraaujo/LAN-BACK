import jwt, { type SignOptions, type Secret } from "jsonwebtoken";

export interface IPayload {
  [key: string]: any;
}

export interface IJWTProvider {
  sign(
    payload: IPayload,
    secret: string,
    expiresIn: string,
    subject: string,
  ): Promise<string>;
  verify(token: string, secret: string): Promise<IPayload>;
}
export class JsonwebtokenProvider implements IJWTProvider {
  public async sign(
    payload: IPayload,
    secret: string,
    expiresIn: string,
    subject: string,
  ): Promise<string> {
    const options: SignOptions = {
      subject,
      expiresIn: expiresIn as any,
    };

    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret as Secret, options, (err, token) => {
        if (err) return reject(err);
        return resolve(token as string);
      });
    });
  }

  public async verify(token: string, secret: string): Promise<IPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret as Secret, (err, decoded) => {
        if (err) return reject(new Error("Invalid token"));
        return resolve(decoded as IPayload);
      });
    });
  }
}
