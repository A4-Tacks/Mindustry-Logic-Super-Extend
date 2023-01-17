const SwapI = {
    _(builder, target, a, b) {
        this.target = builder.var(target);
        this.a = builder.var(a);
        this.b = builder.var(b);
    },

    run(exec) {
        from = exec.building(this.target);  // get mem

        // if is mem and team eq
        if (!(from === null) && from instanceof MemoryBlock.MemoryBuild
                && from.team == exec.team) {
            let mem = from.memory;
            let len = mem.length;
            let a = exec.numi(this.a);
            let b = exec.numi(this.b);
            const check = (i) => 0 <= i && i < len;
            if (!(check(a) && check(b)))
                return;
            let temp = mem[a];
            mem[a] = mem[b];
            mem[b] = temp;
        }
    }
};

const SwapStatement = {
    new: words => {
        const st = extend(LStatement, Object.create(SwapStatement));
        st.read(words);
        return st;
    },

    read(words) {
        this.target = words[1] || "cell1";
        this.a = words[2] || "a";
        this.b = words[3] || "b";
    },

    build(h) {
        if (h instanceof Table) {
            return this.buildt(h);
        }

        const inst = extend(LExecutor.LInstruction, Object.create(SwapI));
        inst._(h, this.target, this.a, this.b);
        return inst;
    },

    buildt(table) {
        const add = (sep, name) => {
            table.add(sep);
            this.field(table, this[name], str => {this[name] = str});
            this.row(table);
        };
        
        add("from ", "target");
        add(" swap ", "a");
        add(" <=> ", "b");
    },

    write(b) {
        b.append("swap ");

        b.append(this.target);
        b.append(" ");

        b.append(this.a);
        b.append(" ");

        b.append(this.b);
    },

    name: () => "Swap",
    color: () => Pal.logicIo
};

global.anuke.register("swap", SwapStatement, [
    "swap",
    "",
    "",
    ""
]);

module.exports = SwapStatement;
