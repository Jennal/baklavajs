import { Editor } from "@/index";
import TestNode from "testimpl/TestNode";
import OutputNode from "testimpl/OutputNode";
import { expect } from "chai";

describe("Editor", () => {

    it("can construct", () => {
        expect(new Editor()).to.not.be.null;
    });

    it("can register a new node type", () => {
        const e = new Editor();
        e.registerNodeType("testnode", TestNode);
        e.registerNodeType("withcategory", TestNode, "testcategory");
        expect(e.nodeCategories.testcategory[0]).to.equal("withcategory");
        expect(e.nodeTypes.testnode).to.equal(TestNode);
        expect(e.nodeTypes.withcategory).to.equal(TestNode);
    });

    it("can create a node by name", () => {
        const e = new Editor();
        e.registerNodeType("testnode", TestNode);
        const n = e.addNode("testnode");
        expect(n).to.not.be.undefined;
        expect(e.nodes[0]).to.equal(n);
    });

    it("returns undefined when creating a node from an unregistered node type name", () => {
        const e = new Editor();
        const n = e.addNode("unknown");
        expect(n).to.be.undefined;
    });

    it("can create a node by instance", () => {
        const e = new Editor();
        const n = new TestNode();
        const r = e.addNode(n);
        expect(r).to.equal(n);
        expect(e.nodes[0]).to.equal(n);
    });

    it("calls the register function of a node", () => {
        const e = new Editor();
        const n = new TestNode();
        e.addNode(n);
        expect(n.registerCalled).to.be.true;
    });

    it("can remove a node", () => {
        const e = new Editor();
        const n = new TestNode();
        e.addNode(n);
        expect(e.nodes).to.have.lengthOf(1);
        e.removeNode(n);
        expect(e.nodes).to.have.lengthOf(0);
    });

    it("can add a connection", () => {
        const e = new Editor();
        const n1 = e.addNode(new TestNode())!;
        const n2 = e.addNode(new OutputNode())!;
        const c = e.addConnection(n1.getInterface("Output"), n2.getInterface("BooleanInput"));
        expect(e.connections).to.have.lengthOf(1);
        expect(e.connections[0]).to.equal(c);
        expect(c!.from).to.equal(n1.getInterface("Output"));
        expect(c!.to).to.equal(n2.getInterface("BooleanInput"));
        expect(e.nodeCalculationOrder).to.have.lengthOf(2);
        expect(e.nodeCalculationOrder[0]).to.equal(n1);
        expect(e.nodeCalculationOrder[1]).to.equal(n2);
    });

    it("can add a connection without recalculating the node tree", () => {
        const e = new Editor();
        const n1 = e.addNode(new TestNode())!;
        const n2 = e.addNode(new OutputNode())!;
        e.addConnection(n1.getInterface("Output"), n2.getInterface("BooleanInput"), false);
        expect(e.nodeCalculationOrder).to.have.lengthOf(1);
    });

    it("can remove a connection", () => {
        const e = new Editor();
        const n1 = e.addNode(new TestNode())!;
        const n2 = e.addNode(new OutputNode())!;
        const c = e.addConnection(n1.getInterface("Output"), n2.getInterface("BooleanInput"));
        expect(e.connections).to.have.lengthOf(1);
        expect(e.nodeCalculationOrder).to.have.lengthOf(2);
        e.removeConnection(c!);
        expect(e.connections).to.have.lengthOf(0);
        expect(e.nodeCalculationOrder).to.have.lengthOf(1);
        expect(c!.destructed).to.be.true;
    });

    it("can remove a connection without recalculating the node tree", () => {
        const e = new Editor();
        const n1 = e.addNode(new TestNode())!;
        const n2 = e.addNode(new OutputNode())!;
        const c = e.addConnection(n1.getInterface("Output"), n2.getInterface("BooleanInput"));
        expect(e.nodeCalculationOrder).to.have.lengthOf(2);
        e.removeConnection(c!, false);
        expect(e.nodeCalculationOrder).to.have.lengthOf(2);
    });

    it("does allow regular connections even if an input is connected to an output", () => {
        const e = new Editor();
        const n1 = e.addNode(new TestNode())!;
        const n2 = e.addNode(new OutputNode())!;
        expect(e.checkConnection(n2.getInterface("BooleanInput"), n1.getInterface("Output"))).to.not.be.false;
        expect(e.addConnection(n2.getInterface("BooleanInput"), n1.getInterface("Output"))).to.not.be.undefined;
    });

    it("does allow connections between two different interface types if there is a conversion", () => {
        const e = new Editor();
        const n1 = e.addNode(new TestNode())!;
        const n2 = e.addNode(new OutputNode())!;
        e.nodeInterfaceTypes
            .addType("boolean", "yellow")
            .addType("string", "gray")
            .addConversion("boolean", "string", (x: boolean) => String(x));
        expect(e.checkConnection(n1.getInterface("Output"), n2.getInterface("Input"))).to.not.be.false;
        expect(e.addConnection(n1.getInterface("Output"), n2.getInterface("Input"))).to.not.be.undefined;
    });

    it("does not allow connections where source and target are the same node", () => {
        const e = new Editor();
        const n = e.addNode(new TestNode())!;
        const if1 = n.getInterface("Output");
        const if2 = n.getInterface("Input");
        expect(e.checkConnection(if1, if2)).to.be.false;
        expect(e.addConnection(if1, if2)).to.be.undefined;
    });

    it("does not allow connections that would result in a cycle in the graph", () => {
        const e = new Editor();
        const n1 = e.addNode(new TestNode())!;
        const n2 = e.addNode(new TestNode())!;
        const n3 = e.addNode(new OutputNode())!;
        expect(e.addConnection(n2.getInterface("Output"), n3.getInterface("BooleanInput"))).to.not.be.undefined;
        expect(e.addConnection(n2.getInterface("Output"), n1.getInterface("Input"))).to.not.be.undefined;
        expect(e.checkConnection(n1.getInterface("Output"), n2.getInterface("Input"))).to.be.false;
        expect(e.addConnection(n1.getInterface("Output"), n2.getInterface("Input"))).to.be.undefined;
    });

    it("does not allow connections between incompatible node interface types", () => {
        const e = new Editor();
        const n1 = e.addNode(new TestNode())!;
        const n2 = e.addNode(new OutputNode())!;
        expect(e.checkConnection(n1.getInterface("Output"), n2.getInterface("Input"))).to.be.false;
        expect(e.addConnection(n1.getInterface("Output"), n2.getInterface("Input"))).to.be.undefined;
    });

    it("can calculate the node tree correctly"); // TODO

    it("can save and load a state"); // TODO

});
