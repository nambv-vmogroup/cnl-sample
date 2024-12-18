import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Piscina } from 'piscina';
import { join } from 'path';
import * as os from 'os';

import { Cat } from './entities/cat.entity';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';

@Injectable()
export class CatService {
  constructor(@InjectRepository(Cat) private catRepository: Repository<Cat>) {}

  private pool = new Piscina({
    filename: join(__dirname, `../../workers/fibonacci.worker.${process.env.NODE_ENV === 'test' ? 'ts' : 'js'}`), // Worker file
    maxThreads: Math.max(2, os.cpus().length - 1), // Maximum number of threads
    idleTimeout: 10000, // Close thread if idle
  });

  async create(createCatDto: CreateCatDto) {
    const cat = this.catRepository.create(createCatDto);
    return this.catRepository.save(cat);
  }

  async calculateFibWorker(n: number) {
    try {
      return await this.pool.run(n);
    } catch (error) {
      return error;
    }
  }

  private fibSync = (n: number): number => {
    if (n <= 1) return n;
    return this.fibSync(n - 1) + this.fibSync(n - 2);
  };

  async calculateFibSync(n: number) {
    return this.fibSync(n);
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
