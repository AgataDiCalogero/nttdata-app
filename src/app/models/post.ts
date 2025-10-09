// Types for posts and comments from the gorest API
export interface Post {
  id: number;
  user_id: number;
  title: string;
  body: string;
}

export type CreatePost = Omit<Post, 'id'>;

export interface Comment {
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
}

export type CreateComment = Omit<Comment, 'id'>;
