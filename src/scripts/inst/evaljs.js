const EvaljsI = { // {{{
    _(builder, output, text, a, b, c, err) {
        this.output = builder.var(output);
        this.text = builder.var(text);
        this.a = builder.var(a);
        this.b = builder.var(b);
        this.c = builder.var(c);
        this.err = builder.var(err);
        this.bud = builder;
    },

    run(exec) {
        // f = new Function("arg", exec.obj(this.text)); // run error
        var t = this;
        var a = this.a;
        var b = this.b;
        var c = this.c;
        var ot = this.output;
        var source = "" + exec.obj(this.text);
        var result, e, efmt;
        const PIPE = {};

        // functions
        const to = x => exec.obj(x); // get id value to obj
        const tn = x => exec.num(x); // get id value to num
        const tb = x => {
            let from = exec.building(x);
            if (is_empty(from))
                return null;
            return from;
        }; // get id value to builder

        const so = (k, v) => {exec.setobj(k, v); return v}; // set id value to obj
        const sn = (k, v) => {exec.setnum(k, v); return v}; // set id value to num
        const se = x => this.err = x; // set error output var (default: output)

        const gv = x => this.bud.var(x); // get var id

        const echo = (target, text) => {
            let v = to(target);
            so(target, (is_empty(v))
                    ? text + "\n" : v + "" + text + "\n")
        };
        
        const get_err_info = (e) => "%0\n%1\n%2\n".fmt(e.name, e.message, e.stack);

        so(this.err, null);  // set default value is null
        so(this.output, null);

        // 快捷函数定义宏展开
        let script;
        try {
            script = function_macro(source);
        } catch (e) {
            so(this.err, get_err_info(e));
            return;
        }

        result = null;
        PIPE.run_is_err = null;
        efmt = null;
        
        let eval_run_thread;
    
        try {
            eval_run_thread = Thread(function() {
                try {
                    result = eval(script);
                } catch (e) {
                    PIPE.run_is_err = e; // timeout error
                    return;
                }
            });
            eval_run_thread.setDaemon(true);
            eval_run_thread.start();

            eval_run_thread.join(timeout);
        } catch (e) {
            efmt = get_err_info(e);
        }
        
        if (eval_run_thread.isAlive()) {
            // 运行超时直接错误上抛崩游戏
            throw Error(
                    "RunningTimeOutError\nsource:\n%0\nscript:\n%1\n"
                    .fmt(source, script));
        }
        
        if (!is_empty(PIPE.run_is_err))
            efmt = ((is_empty(efmt) ? "" : efmt)
                    + get_err_info(PIPE.run_is_err));

        if (!is_empty(efmt))
            so(this.err, efmt)

        if (is_empty(result))
            return;

        if (typeof(result) == "number" || (result instanceof Number)) {
            if (to(this.output) === null) {
                exec.setnum(this.output, result);
            } else {
                echo(this.output, result);
            }
        } else {
            echo(this.output, result);
        }
    }
}; // }}}

const EvaljsStatement = { // {{{
    new: words => {
        const st = extend(LStatement, Object.create(EvaljsStatement));
        st.read(words);
        return st;
    },

    read(words) {
        this.output = words[1] || "result";
        this.text = words[2] || '""';
        this.a = words[3] || '0';
        this.b = words[4] || '0';
        this.c = words[5] || '0';
        this.err = "err";
    },

    build(h) {
        if (h instanceof Table) {
            return this.buildt(h);
        }

        const inst = extend(LExecutor.LInstruction, Object.create(EvaljsI));
        inst._(h, this.output, this.text, this.a, this.b, this.c, this.err);
        return inst;
    },

    buildt(table) {
        const add = (sep, name) => {
            table.add(sep).marginLeft(sep.length).left();
            this.row(table);
            this.field(table, this[name], str => {this[name] = str}).left();
            this.row(table);
        };
        add("", "output");
        add("eval", "text");
        add("a=", "a");
        add("b=", "b");
        add("c=", "c");
    },

    write(b) {
        b.append("evaljs ");

        b.append(this.output);
        b.append(" ");

        b.append(this.text);
        b.append(" ");

        b.append(this.a);
        b.append(" ");

        b.append(this.b);
        b.append(" ");

        b.append(this.c);
        b.append(" ");

        b.append(this.err);
    },

    name: () => "EvalJs",
    color: () => Pal.logicIo
}; // }}}

global.anuke.register("evaljs", EvaljsStatement, [
    "evaljs",
    "",
    "",
    "",
    "",
    "",
    ""
]);

module.exports = EvaljsStatement;

/* constant */
const ROOT = this;
const pass = null;

/* Lib */
const doc = () => null;

const is_empty = (x) => (x === null) || (x === undefined);

const default_value = (value, bak_value) => is_empty(value) ? bak_value : value;

const set_time_out = (time) => timeout = (time > 0 ? time : 5000);
set_time_out(0); // set default wait time

const set_read_only_attribute = (obj, attribute) => {
    if (!(attribute in obj))
        return false;
    Object.defineProperty(obj, attribute, {
        value: obj[attribute],
        writable: false,
    });
    return true;
}

const set_all_read_only_attribute = (obj) => {
    if (is_empty(obj) || !(obj instanceof Object))
        return;
    for (let i in obj)
        set_read_only_attribute(obj, i);
}

String.prototype.fmt = function() {
    let num;
    let len = arguments.length;
    let args = Array.from(arguments);
    let format = this;
    return format.replace(/%[0-9%]/g, (x) => {
        if (x == "%%") return "%";
        else return ((num = parseInt(x[1])) < len)
            ? args[num] : "";
    });
}
set_read_only_attribute(String.prototype, "fmt");

String.prototype.repr = function() {
    return JSON.stringify(this);
}

const df = (text) => ((x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) => 
    eval(text));

const Thread = (func) => new java.lang.Thread(
        new java.lang.Runnable({run: func}));

const lib = { // {{{
    message: {
        append: function(from, text) {
            doc("将 text 追加到目标信息板");
            // if is not message
            if (is_empty(from) || !(from instanceof MessageBlock.MessageBuild))
                return;
            from.message.append("" + text);
            return true;
        },
        update: function(from, text) {
            doc("将目标信息板的内容更新为 text");
            // if is not message
            if (is_empty(from) || !(from instanceof MessageBlock.MessageBuild))
                return;
            from.message.setLength(0);
            from.message.append("" + text);
            return true;
        },
        get: function(from) {
            doc("获取目标信息板的内容");
            // if is not message
            if (is_empty(from) || !(from instanceof MessageBlock.MessageBuild))
                return;
            return from.message.toString();
        }
    },
    array: {
        swap: function(arr, a, b) {
            temp = arr[a];
            arr[a] = arr[b];
            arr[b] = temp;
        },
        reverse: function(arr, l, r) {
            let i = l, j = r;
            while (i < j)
                this.swap(arr, i++, j--);
        },
        random: function(arr, start, stop) {
            start = default_value(start, 0);
            stop = default_value(stop, arr.length);
            let rng = stop - start;
            for (let i = start; i < stop; ++i)
                this.swap(arr, i, start + parseInt(Math.random() * rng))
        },
        swaps: function(arr, lstart, lstop, rstart, rstop) {
            doc("通过手摇算法批量交换并根据长度移动中间元素",
                "3个区间均为左开右闭区间",
                "A[lstart, lstop) B[lstop, rstart) C[rstart, rstop)",
                "交换区间A与区间C. swap A and B"
            );
            this.reverse(arr, lstart, lstop);
            this.reverse(arr, lstop, rstart);
            this.reverse(arr, rstart, rstop);
            this.reverse(arr, lstart, rstop);
        },
        binary_search: function(arr, num, start, stop, key) {
            doc("[start, stop)");
            if (start < stop) {
                key = default_value(key, (x) => x);
                let i = start;
                let j = stop;
                let mid, n;
                while (i < j) {
                    mid = lib.math.middle(i, j);
                    n = key(arr[mid]);
                    if (n < num)
                        i = mid + 1;
                    else if (n > num)
                        j = mid;
                    else return mid;
                }
            }
            return -1;
        },
        binary_search_first_greater_num: function(arr, num, start, stop, key) {
            doc("[start, stop) 返回一个下标",
                    "返回第一个大于 num 的元素");
            let i = start;
            let j = stop;
            let mid, n;
            if (!(start < stop)) return -1;
            key = default_value(key, (x) => x);
            while (i < j) {
                mid = lib.math.middle(i, j);
                n = key(arr[mid]);
                if (n > num)
                    j = mid;
                else
                    i = mid + 1;
            }
            return i;
        },
        binary_search_first_greater_equals_num: function(arr, num, start, stop, key) {
            doc("[start, stop) 返回一个下标",
                    "当 num 在 arr 中时, 返回 arr 中第一个 num",
                    "否则返回第一个大于 num 的元素");
            let i = start;
            let j = stop;
            let mid, n;
            if (!(start < stop)) return -1;
            key = default_value(key, (x) => x);
            while (i < j) {
                mid = lib.math.middle(i, j);
                n = key(arr[mid]);
                if (n < num)
                    i = mid + 1;
                else
                    j = mid;
            }
            return i;
        },
        merge: function(arr, start, split, stop, key) {
            doc("合并两个相邻的有序序列");
            if (start == split || split == stop)
                return; // 其中一序列长为0，无需归并
            key = default_value(key, (x) => x);
            if (key(arr[split - 1]) < key(arr[split]))
                return; // 无需归并
            start = this.binary_search_first_greater_num(
                    arr, key(arr[split]), start, split, key);
            stop = this.binary_search_first_greater_num(
                    arr, key(arr[split - 1]), split, stop, key);
            let temp_arr; // apply temp array
            let i, j, k, len1, len2, k1, k2;
            len1 = split - start;
            len2 = stop - split;
            if (len1 < len2) {
                // left child array less then right child array
                temp_arr = new Array(len1);
                for (let i = start, j = 0; i < split;)
                    temp_arr[j++] = arr[i++];
                i = split;
                j = 0;
                k = start;
                k1 = key(arr[i]), k2 = key(temp_arr[j]);
                while (i < stop && j < len1) {
                    if (k1 < k2) {
                        arr[k] = arr[i];
                        k1 = key(arr[++i]);
                    } else {
                        arr[k] = temp_arr[j];
                        k2 = key(temp_arr[++j]);
                    }
                    ++k;
                }
                while (j < len1)
                    arr[k++] = temp_arr[j++];
            } else {
                temp_arr = new Array(len2);
                for (let i = split, j = 0; i < stop;)
                    temp_arr[j++] = arr[i++];
                i = split - 1;
                j = len2 - 1;
                k = stop - 1;
                k1 = key(arr[i]), k2 = key(temp_arr[j]);
                while (!(i < start) && j > -1) {
                    if (k1 > k2) {
                        arr[k] = arr[i];
                        k1 = key(arr[--i]);
                    } else {
                        arr[k] = temp_arr[j];
                        k2 = key(temp_arr[--j]);
                    }
                    --k;
                }
                while (j > -1)
                    arr[k--] = temp_arr[j--];
            }
        },
        while: function(arr, l, r, reverse) {
            reverse = default_value(reverse, false);
            let i, j;
            let num;
            if (reverse) {
                num = arr[l];
                i = l;
                while ((j = i++) < r)
                    arr[j] = arr[i];
                arr[r] = num;
            } else {
                num = arr[r];
                i = r;
                while ((j = i--) > l)
                    arr[j] = arr[i];
                arr[l] = num;
            }
        },
        insertion_sort: function(arr, start, stop, key) {
            if (stop - start < 2)
                return;
            key = default_value(key, (x) => x);
            start = default_value(start, 0);
            stop = default_value(stop, arr.length);
            for (let i=start + 1; i < stop; ++i) {
                let num = arr[i];
                let knum = key(num);
                for (var j=i; j > start && key(arr[j - 1]) > knum; --j)
                    arr[j] = arr[j - 1];
                arr[j] = num;
            }
        },
        insertion_sort_binary: function(arr, start, stop, key) {
            // is stable sort
            if (stop - start < 2)
                return;
            key = default_value(key, (x) => x);
            start = default_value(start, 0);
            stop = default_value(stop, arr.length);
            for (let i=start + 1; i < stop; ++i) {
                let num = arr[i];
                let knum = key(num);
                this.while(arr, this.binary_search_first_greater_num(
                        arr, knum, start, i, key), i);
            }
        },
        quick_sort: function(arr, start, stop, key, insertion_threshold) {
            const This = this;
            if (is_empty(arr))
                return;
            key = default_value(key, (x) => x);
            start = default_value(start, 0);
            stop = default_value(stop, arr.length);
            insertion_threshold = default_value(insertion_threshold, 32);
            var tag = true;
            const quick_sort = (l, r) => {
                let pivot, j, i;
                while (l < r) {
                    if (r - l < insertion_threshold) {
                        This.insertion_sort(arr, l, r + 1, key);
                        return;
                    }
                    This.swap(arr, lib.math.middle(l, r), r);
                    pivot = key(arr[r]);
                    j = l;
                    for (i=l; i < r; ++i){
                        num = key(arr[i]);
                        if (num < pivot
                                || (num == pivot && (tag=!tag))) {
                            This.swap(arr, i, j++);
                        }
                    }
                    This.swap(arr, r, j);
                    quick_sort(l, j - 1);
                    l = j + 1;
                }
            }
            quick_sort(start, stop - 1);
        },
        merge_sort: function(arr, start, stop, key, insertion_threshold) {
            start = default_value(start, 0);
            stop = default_value(stop, arr.length);
            insertion_threshold = default_value(insertion_threshold, 24);
            const T = this;
            function main(start, stop) {
                let mid = lib.math.middle(start, stop);
                if (start < mid) {
                    if (stop - start < insertion_threshold) {
                        T.insertion_sort(arr, start, stop, key);
                        return;
                    }
                    main(start, mid);
                    main(mid, stop);
                    T.merge(arr, start, mid, stop, key);
                }
            }
            main(start, stop);
        },
    },
    math: { // {{{
        middle: (a, b) => a + ((b - a) >> 1),
        ceil: (x) => {
            let num = parseInt(x);
            return (num > 0
                    ? ((x == num) ? num : num + 1)
                    : num);
        },
        floor: (x) => {
            let num = parseInt(x);
            return (num < 0
                    ? ((x == num) ? num : num - 1)
                    : num);
        },
        max: (a, b) => a > b ? a : b,
        min: (a, b) => a < b ? a : b,
        isNaN: (x) => x === NaN,
        isInf: (x) => x === this.Inf || x === this.nInf,
        Inf: Infinity,
        nInf: -Infinity,
    }, // }}}
}
set_all_read_only_attribute(lib);
// }}}
const function_macro = function(script) { // {{{
    doc("快捷函数定义宏展开");
    let lines = script.split("\n");
    let fname, temp, temp1, is_macro_a, fline;
    let length = lines.length;
    let i = 0;
    let in_func = false;
    let args, len;
    let t_lines = new Array();
    let has_return_regExp = /^(@|return\b)\s*(.*)$/;
    let has_return;
    let default_result = "return eval('')";
    let indent, line;
    const indent_push = (x) => t_lines.push(indent + x);
    for (; i < length; ++i) {
        is_macro_a = false;
        temp1 = lines[i].match(/^(\s*)(.*)$/);
        indent = temp1[1];
        line = temp1[2];
        len = line.length;
        if (len == 0) {
            indent_push("");
            continue; // skip empty line
        }
        if (line[0] == "#") {
            is_macro_a = true; // 使用标记完成跨块处理
            if (in_func) {
                // write func
                if (!has_return)
                    indent_push(default_result); // 当没有返回值则添加缺省
                t_lines.push(indent + "}");
            }
            // 井号打头表结束函数内标识
            in_func = false;
        }
        if (temp = line.match(/^#([a-zA-Z_][a-zA-Z0-9_]*)/)) {
            in_func = true; // force set in_func
            has_return = false;
            fname = temp[1];
            //args = line.slice(fname.length + 1).trim().split(/\s+/); // fun args string
            // 因mdt的js引擎bug，导致以上代码的结果不正确
            // 在 rhino1.7.10 rhino1.7.14 nodejs12.22.9 均无问题
            /* 如果将其改为:
             * args = line.slice(fname.length + 1).trim().split(/\s{10,}/)
             * 还会崩游戏，log: FAILED ASSERTION: invalid bytecode
             * 所以不使用正则一次分割而是先分割至临时数组再将非空元素加入目标
             */
            temp = line.slice(fname.length + 1).trim().split(/\s/); // fun args string
            args = [];
            temp.map((x) => {
                if (x.length > 0)
                    args.push(x);
            });
            for (let j in args) {
                // 参数检查
                if (!args[j].match(/^[a-zA-Z_][a-zA-Z0-9_]*$/))
                    throw Error("line:%0; func:%1; arg:%2; args:[%3]; 标识符格式错误"
                        .fmt(i + 1, fname, args[j], args.join(", ")));
            }
            t_lines.push("%0function %1(%2) {".fmt(indent, fname, args.join(", ")));
        } else {
            if (is_macro_a) {
                // 当一行宏展开控制符并没有定义时说明是一个结束符
                // 检查是否符合一个结束符的长度
                if (len != 1)
                    throw Error(("line:%0; >%1<; 宏定义结束符格式错误, 需要/^#$/, "
                        + "或者#后方标识符格式错误")
                        .fmt(i + 1, line));
                continue;
            }
            if (in_func) {
                // 函数体处理
                if (temp = line.match(has_return_regExp)) {
                    has_return = true;
                    if (temp[2].length > 0) {
                        temp = line.replace(has_return_regExp,
                            "{let ___= $2 \nreturn eval('___')}").split("\n");
                        indent_push(temp[0]);
                        indent_push(temp[1]);
                    } else {
                        indent_push(default_result);
                    }
                    continue;
                }
            }
            if (in_func)
                indent_push(line);
            else
                t_lines.push(indent + line);
        }
    }
    if (in_func)
        throw Error("line:%0; function %1(%2); 宏定义未结束, 你是否忘了 /^#$/ ?"
            .fmt(i + 1, line));
    return t_lines.join("\n");
} // }}}
