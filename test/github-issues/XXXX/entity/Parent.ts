import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "../../../../src";
import { Child } from "./Child"

@Entity()
export class Parent {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @OneToOne(type => Child, { cascade: ['update']})
    @JoinColumn()
    child: Child;
}
