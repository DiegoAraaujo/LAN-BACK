export interface IUserTokenProps {
  id?: string;
  refresh_token: string;
  user_id: string;
  expires_date: Date;
  created_at?: Date;
}

export class UserToken {
  private props: IUserTokenProps;

  constructor(props: IUserTokenProps) {
    this.props = {
      ...props,
    };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get refresh_token(): string {
    return this.props.refresh_token;
  }

  get user_id(): string {
    return this.props.user_id;
  }

  get expires_date(): Date {
    return this.props.expires_date;
  }

  get created_at(): Date | undefined {
    return this.props.created_at;
  }

  set refresh_token(value: string) {
    this.props.refresh_token = value;
  }

  set expires_date(value: Date) {
    this.props.expires_date = value;
  }
}
