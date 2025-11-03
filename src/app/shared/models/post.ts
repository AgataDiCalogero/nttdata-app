export interface Post {
  id: number;
  user_id: number;
  title: string;
  body: string;
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
  user_id: number | null;
}

export interface QueryCriteria {
  page: number;
  per_page: number;
  title?: string;
  user_id?: number;
  reload: number;
}
