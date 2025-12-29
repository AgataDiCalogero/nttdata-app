export interface Post {
  id: number;
  user_id: number;
  title: string;
  body: string;
  comments_count?: number;
}

export type CreatePost = Omit<Post, 'id'>;
export type UpdatePost = Partial<CreatePost>;

export interface Comment {
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
}

export type CreateComment = Omit<Comment, 'id' | 'post_id'>;
export type UpdateComment = Partial<Omit<Comment, 'id' | 'post_id'>>;

export interface PostFilters {
  title: string | null;
  userId: number | null;
}

export interface QueryCriteria {
  page: number;
  perPage: number;
  title?: string;
  userId?: number;
  reload: number;
}
