import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(regionCode?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT com.slug, com.name, com.cut, r.code AS region
      FROM commune com JOIN region r ON r.id = com.region_id
      WHERE com.is_active = TRUE AND (${regionCode}::text IS NULL OR r.code = ${regionCode})
      ORDER BY com.name`;
    return { data: rows };
  }
}
