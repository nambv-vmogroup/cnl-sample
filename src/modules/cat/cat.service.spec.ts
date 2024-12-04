import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatService } from './cat.service';
import { Cat } from './entities/cat.entity';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';

describe('CatService', () => {
  let service: CatService;
  let repository: Repository<Cat>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatService,
        {
          provide: getRepositoryToken(Cat),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<CatService>(CatService);
    repository = module.get<Repository<Cat>>(getRepositoryToken(Cat));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a cat', async () => {
    const createCatDto: CreateCatDto = {
      name: 'Tom',
      age: 3,
      breed: 'Siamese',
    };
    const cat = { id: 1, ...createCatDto };

    jest.spyOn(repository, 'create').mockReturnValue(cat as any);

    expect(await service.create(createCatDto)).toEqual(cat);
  });

  it('should find all cats', async () => {
    const cat = {
      id: 1,
      name: 'Tom',
      age: 3,
      breed: 'Siamese',
    } as unknown as Cat;
    const cats = [cat];

    jest.spyOn(repository, 'find').mockResolvedValue(cats);

    expect(await service.findAll()).toEqual(cats);
  });

  it('should find one cat by id', async () => {
    const cat = { id: 1, name: 'Tom', age: 3, breed: 'Siamese' };

    jest.spyOn(repository, 'findOne').mockResolvedValue(cat as any);

    expect(await service.findOne(1)).toEqual(cat);
  });

  it('should update a cat', async () => {
    const updateCatDto: UpdateCatDto = {
      name: 'Tommy',
      age: 4,
      breed: 'Siamese',
    };

    jest.spyOn(repository, 'update').mockResolvedValue({ affected: 1 } as any);

    expect(await service.update(1, updateCatDto)).toEqual({ affected: 1 });
  });

  it('should remove a cat', async () => {
    jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1 } as any);

    expect(await service.remove(1)).toEqual({ affected: 1 });
  });
});
