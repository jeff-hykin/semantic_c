// 
// top level declarations
// 
    int aaa;
    int; // yep this is valid for some reason
    int global;
    short global2;
    struct AAAAAA { } aaaaaa;
    long long** var_dec_4;
    short const int** var_dec_5[22]; // breaks tree sitter (locally), but is valid C
    static const int *var_dec_6[22];
    double (*c_arrays_suck)[2][3][4]; 
    double *(**(*(**c_arrays_suck_a_lot)[2])[3])[4], im_a_double, **trash; 
    int *(*an_array_of_func_ptr[69])(
        int,
        char *argv[],
        const short int**[],
        long long***,
        void (*)(
            double *(**(*(**)[2])[3])[4],
            double (*)[2][3][4]
        )
    ),
    im_an_int, // normal int
    * (*pArr)[12]; // pArr is a pointer to array of 12 int-pointers
    
// 
// function declare
// 
    int inc_global (void);
    extern inline void extern_inline_1(void);
    extern inline AAAAAA extern_inline_2(void);
    extern inline struct AAAAAA extern_inline_3(void);
    const short int** func_dec_4(void);
    const short int** func_dec_5(register int a);
    
// 
// function definitions
// 
    int inc_global (void)
    {
        global++;
        int aaa = 0;
        return aaa;
    }
    
    long int inc_global_2 (void)
    {
        int aaa = 0;
        global++;
        return aaa;
    }
    
    AAAAAA inc_global_2 (void)
    {
        return aaaaaa;
    }

// 
// top level assignment
// 
    const int a = 0;
    const int assignment1 = 1, assignment2 = 2;
    const short int** var_def = NULL;

// 
// typedefs
// 
    typedef unsigned char u8;
    typedef int (*fptr)(int);
    typedef struct {} empty_s;
    typedef const short int** long_and_complicated_short;

// 
// structs
// 
    struct contains_empty;
    struct contains_empty {
        u8 a;
        empty_s empty;
        u8 b;
    } struct_var;
    struct contains_empty ce = { { (1) }, (empty_s){}, 022, };

// 
// struct assignment
// 
    struct SpecialInlineStruct gs = ((struct SpecialInlineStruct){1, 2, 3, 4});
    struct SpecialInlineStruct gs2 = {1, 2, {3, 4}};
    struct T gt = {"hello", 42};
    struct U gu = {3, 5,6,7,8, 4, "huhu", 43};
    struct U gu2 = {3, {5,6,7,8}, 4, {"huhu", 43}};
    /* Optional braces around scalar initializers.  Accepted, but with
    a warning.  */
    struct U gu3 = { {3}, {5,6,7,8,}, 4, {"huhu", 43}};
    /* Many superfluous braces and leaving out one initializer for U.s.c[1] */
    struct U gu4 = { 3, {5,6,7,},  5, { "bla", {44}} };
    /* Superfluous braces and useless parens around values */
    struct SpecialInlineStruct gs3 = { (1), {(2)}, {(((3))), {4}}};
    /* Superfluous braces, and leaving out braces for V.t, plus cast */
    struct V gv = {{{3},4,{5,6}}, "haha", (u8)45, 46};
    /* Compound literal */
    struct V gv2 = {(struct SpecialInlineStruct){7,8,{9,10}}, {"hihi", 47}, 48};
    /* Parens around compound literal */
    struct V gv3 = {((struct SpecialInlineStruct){7,8,{9,10}}), {"hoho", 49}, 50};
    /* Initialization of a flex array member (warns in GCC) */
    struct W gw = {{1,2,3,4}, {1,2,3,4,5}};


// 
// unions
// 
    union UU {
        u8 a;
        u8 b;
    };
    struct SU {
        union UU u;
        u8 c;
    };
    struct SU gsu = {5,6};

    /* Unnamed struct/union members aren't ISO C, but it's a widely accepted
    extension.  See below for further extensions to that under -fms-extension.*/
    union UV {
        struct {u8 a,b;};
        struct SpecialInlineStruct s;
    };
    union UV guv = {{6,5}};
    union UV guv2 = {{.b = 7, .a = 8}};
    union UV guv3 = {.b = 8, .a = 7};

    /* Under -fms-extensions also the following is valid:
    union UV2 {
        struct Anon {u8 a,b;};    // unnamed member, but tagged struct, ...
        struct SpecialInlineStruct s;
    };
    struct Anon gan = { 10, 11 }; // ... which makes it available here.
    union UV2 guv4 = {{4,3}};     // and the other inits from above as well
    */

// 
// inline union
// 
    struct in6_addr {
        union {
            u8 u6_addr8[16];
            unsigned short u6_addr16[8];
        } u;
    };

// 
// inline nested struct
// 
    struct flowi6 {
        struct in6_addr saddr, daddr;
    };
    struct pkthdr {
        struct in6_addr daddr, saddr;
    };
    struct pkthdr phdr = { { { 6,5,4,3 } }, { { 9,8,7,6 } } };

// TODO: whatever this is: 

    // struct Wrap {
    //     void *func;
    // };

    // struct Wrap global_wrap[] = {
    //     ((struct Wrap) {inc_global}),
    //     inc_global,
    // };

// 
// some kinda function table
// 
    // void sys_ni(void) { printf("ni\n"); }
    // void sys_one(void) { printf("one\n"); }
    // void sys_two(void) { printf("two\n"); }
    // void sys_three(void) { printf("three\n"); }
    // typedef void (*fptr)(void);
    // const fptr table[3] = {
    //     [0 ... 2] = &sys_ni,
    //     [0] = sys_one,
    //     [1] = sys_two,
    //     [2] = sys_three,
    // };

void foo (struct W *w, struct pkthdr *phdr_) {
    struct SpecialInlineStruct ls = {1, 2, 3, 4};
    struct SpecialInlineStruct ls2 = {1, 2, {3, 4}};
    struct T lt = {"hello", 42};
    struct U lu = {3, 5,6,7,8, 4, "huhu", 43};
    struct U lu1 = {3, ls, 4, {"huhu", 43}};
    struct U lu2 = {3, (ls), 4, {"huhu", 43}};
    const struct SpecialInlineStruct *pls = &ls;
    struct SpecialInlineStruct ls21 = *pls;
    struct U lu22 = {3, *pls, 4, {"huhu", 43}};
    /* Incomplete bracing.  */
    struct U lu21 = {3, ls, 4, "huhu", 43};
    /* Optional braces around scalar initializers.  Accepted, but with a warning.  */
    struct U lu3 = { 3, {5,6,7,8,}, 4, {"huhu", 43}};
    /* Many superfluous braces and leaving out one initializer for U.s.c[1] */
    struct U lu4 = { 3, {5,6,7,},  5, { "bla", 44} };
    /* Superfluous braces and useless parens around values */
    struct SpecialInlineStruct ls3 = { (1), (2), {(((3))), 4}};
    /* Superfluous braces, and leaving out braces for V.t, plus cast */
    struct V lv = {{3,4,{5,6}}, "haha", (u8)45, 46};
    /* Compound literal */
    struct V lv2 = {(struct SpecialInlineStruct)w->t.s, {"hihi", 47}, 48};
    /* Parens around compound literal */
    struct V lv3 = {((struct SpecialInlineStruct){7,8,{9,10}}), ((const struct W *)w)->t.t, 50};
    const struct pkthdr *phdr = phdr_;
    struct flowi6 flow = { .daddr = phdr->daddr, .saddr = phdr->saddr };
    int elt = 0x42;
    /* Range init, overlapping */
    struct T lt2 = { { [1 ... 5] = 9, [6 ... 10] = elt, [4 ... 7] = elt+1 }, 1 };
}

void test_compound_with_relocs (void) {
  struct Wrap local_wrap[] = {
      ((struct Wrap) {inc_global}),
      inc_global,
  };
  void (*p)(void);
  p = global_wrap[0].func; p();
  p = global_wrap[1].func; p();
  p = local_wrap[0].func; p();
  p = local_wrap[1].func; p();
}

void test_multi_relocs(void) {
  int i;
  for (i = 0; i < sizeof(table)/sizeof(table[0]); i++)
    table[i]();
}

/* Following is from GCC gcc.c-torture/execute/20050613-1.c.  */

struct SEA { int i; int j; int k; int l; };
struct SEB { struct SEA a; int r[1]; };
struct SEC { struct SEA a; int r[0]; };
struct SED { struct SEA a; int r[]; };

static void test_correct_filling (struct SEA *x) {
  static int i;
  if (x->i != 0 || x->j != 5 || x->k != 0 || x->l != 0)
    // printf("sea_fill%d: wrong\n", i);
    aaa;
  else
    aaa;    
  i++;
}

int test_zero_init (void) {
    /* The peculiarity here is that only a.j is initialized.  That
        means that all other members must be zero initialized.  TCC
        once didn't do that for sub-level designators.  */
    struct SEB b = { .a.j = 5 };
    struct SEC c = { .a.j = 5 };
    struct SED d = { .a.j = 5 };
    test_correct_filling (&b.a);
    test_correct_filling (&c.a);
    test_correct_filling (&d.a);
    return 0;
}

// static inline void* sx__aligned_alloc(const sx_alloc* alloc, size_t size, uint32_t align, const char* file, const char* func, uint32_t line) {
//     align = ({
//         typeof((int)align) var__a = ((int)align);
//         typeof(8) var__b = (8);
//         (void)(&var__a == &var__b);
//         var__a > 8 ? var__a : var__b;
//     });
//     const size_t total = size + align + sizeof(uint32_t);
//     uint8_t* ptr = (uint8_t*)sx__malloc(alloc, total, 0, file, func, line);
//     ;
//     uint8_t* aligned = (uint8_t*)sx_align_ptr(ptr, sizeof(uint32_t), align);
//     uint32_t* header = (uint32_t*)aligned - 1;
//     *header = (uint32_t)(uintptr_t)(aligned - ptr);
//     return aligned;
// }

int main(int argc, char *argv[]) {
    foo(&gw, &phdr);
    //printf("q: %s\n", q);
    test_compound_with_relocs();
    test_multi_relocs();
    test_zero_init();
    return 0;
}