import * as repo from '../repositories/postsRepo.js';

export function list() {
  return repo.findAll();
}

export function create(dto) {
  return repo.insert(dto);
}
