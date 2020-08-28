import "reflect-metadata";
import { expect } from "chai";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src";
import {Parent} from "./entity/Parent";
import {Child} from "./entity/Child";

describe.only("github issues > #XXXX Saving sets hidden (not selected) fields to NULL", () => {
    const lastName = "Lastname";
    let parentId: number | undefined;
    let childId: number | undefined;
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Parent, Child]
    }));
    beforeEach(async () => {
        await reloadTestingDatabases(connections);
        await Promise.all(connections.map(async connection => {
            const child = new Child();
            child.firstName = "Child";
            child.lastName = lastName;
            await connection.manager.save(child);
            childId = child.id;

            const parent = new Parent();
            parent.firstName = "Parent";
            parent.lastName = lastName;
            parent.child = child;
            await connection.manager.save(parent);
            parentId = parent.id;
        }));
    });
    after(() => closeTestingConnections(connections));

    const fetchChildWithLastName = (connection: any, id: number) => connection.manager.createQueryBuilder()
        .select("child")
        .from(Child, "child")
        .where("child.id = :id", { id })
        .addSelect("child.lastName")
        .getOne() as Child;

    it("when saving child", () => Promise.all(connections.map(async connection => {
        const child = await connection.manager.findOneOrFail(Child, childId as number);

        // lastName is hidden, { select: false } in model => undefined
        expect(child.lastName).to.be.undefined;

        const newFirstName = "My updated Child";
        child.firstName = newFirstName;
        await connection.manager.save(child);

        expect(child.firstName).to.be.equal(newFirstName);
        // After save, this reference is now NULL, but should still be undefined
        expect(child.lastName).to.be.undefined;

        // Names are correct in the db
        const childFromDb = await fetchChildWithLastName(connection, childId as number);
        expect(childFromDb.firstName).to.be.equal(newFirstName);
        expect(childFromDb.lastName).to.be.equal(lastName);
    })));

    it("when saving parent (with cascade update for child) ", () => Promise.all(connections.map(async connection => {
        const parent = await connection.manager.findOneOrFail(Parent, parentId as number, { relations: ["child"]});

        // lastName is hidden, { select: false } in model => undefined
        expect(parent.child.lastName).to.be.undefined;

        const newFirstName = "My updated Child";
        parent.child.firstName = newFirstName;
        await connection.manager.save(parent);

        expect(parent.child.firstName).to.be.equal(newFirstName);
        // After save, this reference is now NULL but should still be undefined
        expect(parent.child.lastName).to.be.undefined;

        // Names are correct in the db
        const childFromDb = await fetchChildWithLastName(connection, childId as number);
        expect(childFromDb.firstName).to.be.equal(newFirstName);
        expect(childFromDb.lastName).to.be.equal(lastName);
    })));
});
