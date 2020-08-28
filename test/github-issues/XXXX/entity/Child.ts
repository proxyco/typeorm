import {Entity, PrimaryGeneratedColumn, Column} from "../../../../src";

@Entity()
export class Child {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column({ length: 255, nullable: true, select: false })
    lastName: string;
}
