export interface IUserProps {
  id?: string;
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class User {
  private props: IUserProps;

  constructor(props: IUserProps) {
    this.props = props;
  }

  get id(): string {
    if (!this.props.id) {
      throw new Error("User ID has not been assigned yet.");
    }
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }
  get email(): string {
    return this.props.email;
  }
  get password(): string {
    return this.props.password;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.createdAt;
  }
  set name(value: string) {
    if (!value || value.trim().length < 3) {
      throw new Error(
        "Name cannot be empty and must have at least 3 characters.",
      );
    }
    this.props.name = value.trim();
  }

  set email(value: string) {
    if (!value || !value.includes("@")) {
      throw new Error("A valid email is required.");
    }
    this.props.email = value.toLowerCase().trim();
  }

  set password(value: string) {
    if (!value || value.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    this.props.password = value;
  }
}

export default User;
