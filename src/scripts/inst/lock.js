const LockI = {
    _(builder, pid, output, target, position) {
        this.pid = builder.var(pid); // typt: int
        this.output = builder.var(output);
        this.target = builder.var(target);
        this.position = builder.var(position);

    },

    run(exec) {
        address = exec.numi(this.position);
        pid = exec.numi(this.pid); // get type is int num
        from = exec.building(this.target);
        
        // if is mem and team eq
        if(!(from === null) && from instanceof MemoryBlock.MemoryBuild 
                && from.team == exec.team) {
            mem = from.memory;
            if (address < 0 || address >= mem.length) {
                exec.setnum(this.output, -1);  // Fail return
                return;
            }
            if ((!!mem[address]) ^ !!pid) {
                mem[address] = (pid ? pid : 0);
                exec.setnum(this.output, 0);
            } else {
                exec.setnum(this.output, mem[address]);
            }
        } else {
            exec.setnum(this.output, -1);  // Fail return
        }
    }
};

const LockStatement = {
    new: words => {
        const st = extend(LStatement, Object.create(LockStatement));
        st.read(words);
        return st;
    },

    read(words) {
        this.pid = words[1] || "false";
        this.output = words[2] || "result";
        this.target = words[3] || "cell1";
        this.position = words[4] || "0";
    },

    build(h) {
        if (h instanceof Table) {
            return this.buildt(h);
        }

        const inst = extend(LExecutor.LInstruction, Object.create(LockI));
        inst._(h, this.pid, this.output, this.target, this.position);
        return inst;
    },

    buildt(table) {
        const add = (sep, name) => {
            table.add(sep);
            this.field(table, this[name], str => {this[name] = str});
            this.row(table);
        };
        
        add("pid ", "pid");
        add("::", "output");
        add("=", "target");
        add("at", "position");
    },

    write(b) {
        b.append("lock ");

        b.append(this.pid);
        b.append(" ");

        b.append(this.output);
        b.append(" ");

        b.append(this.target);
        b.append(" ");

        b.append(this.position);
    },

    name: () => "Lock",
    color: () => Pal.logicIo
};

global.anuke.register("lock", LockStatement, [
    "lock",
    "",
    "",
    "",
    ""
]);

module.exports = LockStatement;
