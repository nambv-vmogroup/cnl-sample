import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cat } from './entities/cat.entity';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';

@Injectable()
export class CatService {
  constructor(@InjectRepository(Cat) private catRepository: Repository<Cat>) {}
  async create(createCatDto: CreateCatDto) {
    const cat = this.catRepository.create(createCatDto);
    return this.catRepository.save(cat);
  }

  async findAll() {
    return this.catRepository.find();
  }

  async findOne(id: number) {
    return this.catRepository.findOne({ where: { id } });
  }

  async update(id: number, updateCatDto: UpdateCatDto) {
    return this.catRepository.update(id, updateCatDto);
  }

  async remove(id: number) {
    return this.catRepository.delete([id]);
  }
}
