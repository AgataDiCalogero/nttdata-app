import type {
  Comment,
  CreateComment,
  CreatePost,
  Post,
  UpdateComment,
  UpdatePost,
} from '@/app/shared/models/post';

export interface PostDto {
  id: number;
  user_id: number;
  title: string;
  body: string;
}

export type CreatePostDto = Omit<PostDto, 'id'>;
export type UpdatePostDto = Partial<CreatePostDto>;

export interface CommentDto {
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
}

export type CreateCommentDto = Omit<CommentDto, 'id'>;
export type UpdateCommentDto = Partial<Omit<CommentDto, 'id'>>;

export const mapPostDto = (dto: PostDto): Post => ({
  ...dto,
  title: dto.title.trim(),
  body: dto.body.trim(),
});
export const mapPostsDto = (list: PostDto[] | null | undefined): Post[] =>
  (list ?? []).map((dto) => mapPostDto(dto));

export const mapCommentDto = (dto: CommentDto): Comment => ({
  ...dto,
  name: dto.name.trim(),
  email: dto.email.trim(),
  body: dto.body.trim(),
});
export const mapCommentsDto = (list: CommentDto[] | null | undefined): Comment[] =>
  (list ?? []).map((dto) => mapCommentDto(dto));

export const mapCreatePostToDto = (payload: CreatePost): CreatePostDto => ({
  user_id: payload.user_id,
  title: payload.title.trim(),
  body: payload.body.trim(),
});

export const mapUpdatePostToDto = (payload: UpdatePost): UpdatePostDto => ({
  ...payload,
  title: typeof payload.title === 'string' ? payload.title.trim() : undefined,
  body: typeof payload.body === 'string' ? payload.body.trim() : undefined,
});

export const mapCreateCommentToDto = (
  postId: number,
  payload: CreateComment,
): CreateCommentDto => ({
  post_id: postId,
  name: payload.name.trim(),
  email: payload.email.trim().toLowerCase(),
  body: payload.body.trim(),
});

export const mapUpdateCommentToDto = (payload: UpdateComment): UpdateCommentDto => ({
  ...payload,
  body: typeof payload.body === 'string' ? payload.body.trim() : undefined,
});
