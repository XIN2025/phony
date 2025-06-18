export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};
