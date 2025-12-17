import type {
  CreateComment,
  CreatePost,
  UpdateComment,
  UpdatePost,
} from '@/app/shared/models/post';
import type { CreateUser, UpdateUser } from '@/app/shared/models/user';

import {
  mapCommentDto,
  mapCommentsDto,
  mapCreateCommentToDto,
  mapCreatePostToDto,
  mapPostDto,
  mapPostsDto,
  mapUpdateCommentToDto,
  mapUpdatePostToDto,
} from './post.dto';
import { mapCreateUserToDto, mapUpdateUserToDto, mapUserDto, mapUsersDto } from './user.dto';
import type { UserDto } from './user.dto';

describe('DTO mapping helpers', () => {
  describe('post DTOs', () => {
    it('maps post arrays safely', () => {
      expect(mapPostsDto(null)).toEqual([]);
      const dto = { id: 1, user_id: 2, title: 'T', body: 'B' };
      expect(mapPostDto(dto).id).toBe(1);
      expect(mapPostsDto([dto]).length).toBe(1);
    });

    it('maps create post payload to DTO', () => {
      const payload: CreatePost = { user_id: 1, title: ' hi ', body: ' bye ' };
      expect(mapCreatePostToDto(payload)).toEqual({
        user_id: 1,
        title: 'hi',
        body: 'bye',
      });
      expect(mapCreatePostToDto({ user_id: 1 } as CreatePost).title).toBe('');
    });

    it('maps update post payload to DTO with trimmed strings', () => {
      const payload: UpdatePost = { title: ' foo ', body: ' bar ' };
      expect(mapUpdatePostToDto(payload)).toEqual({
        title: 'foo',
        body: 'bar',
      });
      expect(mapUpdatePostToDto({ title: undefined } as UpdatePost).title).toBeUndefined();
    });

    it('maps comment arrays safely and handles trimming', () => {
      expect(mapCommentsDto(undefined)).toEqual([]);
      const dto = { id: 1, post_id: 1, name: 'N', email: 'E', body: 'B' };
      expect(mapCommentDto(dto).id).toBe(1);
      const createPayload: CreateComment = {
        name: ' Foo ',
        email: ' BAR@EXAMPLE.COM',
        body: ' Baz ',
      };
      expect(mapCreateCommentToDto(5, createPayload)).toEqual({
        post_id: 5,
        name: 'Foo',
        email: 'bar@example.com',
        body: 'Baz',
      });
    });

    it('maps update comment payload to DTO with optional trimming', () => {
      const update: UpdateComment = { body: '  text  ' };
      expect(mapUpdateCommentToDto(update).body).toBe('text');
      expect(mapUpdateCommentToDto({ body: undefined } as UpdateComment).body).toBeUndefined();
    });
  });

  describe('user DTOs', () => {
    it('maps user arrays safely and trims optional fields', () => {
      expect(mapUsersDto(null)).toEqual([]);
      const dto = { id: 5, name: ' Name ', email: 'email ', status: 'active' as const };
      expect(mapUserDto(dto)).toEqual({
        id: 5,
        name: 'Name',
        email: 'email',
        gender: undefined,
        status: 'active',
      });
    });

    it('gracefully handles missing name/email values', () => {
      const raw = {
        id: 6,
        name: null as unknown as string,
        email: null as unknown as string,
        status: 'active' as const,
      } as UserDto;
      const mapped = mapUserDto(raw);
      expect(mapped.name).toBe('');
      expect(mapped.email).toBe('');
    });

    it('maps user lists through the helper', () => {
      const items = [{ id: 7, name: ' Foo ', email: 'Bar', status: 'inactive' as const }];
      expect(mapUsersDto(items)[0].name).toBe('Foo');
    });

    it('maps create user payload with defaults', () => {
      const payload: CreateUser = { name: ' A ', email: ' B@ExAmPlE.COM ', status: 'inactive' };
      expect(mapCreateUserToDto(payload)).toEqual({
        name: 'A',
        email: 'b@example.com',
        gender: 'male',
        status: 'inactive',
      });

      const partial = { name: ' B ', email: 'C@EXAMPLE.COM' } as CreateUser;
      expect(mapCreateUserToDto(partial).status).toBe('active');
      expect(mapCreateUserToDto(partial).name).toBe('B');
      expect(mapCreateUserToDto(partial).email).toBe('c@example.com');
    });

    it('maps update user payload trimming strings', () => {
      const payload: UpdateUser = { name: ' C ', email: ' D@EXAMPLE.COM ' };
      expect(mapUpdateUserToDto(payload)).toEqual({
        name: 'C',
        email: 'd@example.com',
      });
      expect(
        mapUpdateUserToDto({ name: 123 as unknown as string } as UpdateUser).name,
      ).toBeUndefined();
      expect(
        mapUpdateUserToDto({ email: 123 as unknown as string } as UpdateUser).email,
      ).toBeUndefined();
    });
  });
});
