#include <stdio.h>
#include "lista_sequencial.h"

int main(void) {
    LISTA a, b;

    /* --- Q1: contar --- */
    criar(&a, 10);
    inserir(&a, 3); inserir(&a, 1); inserir(&a, 3); inserir(&a, 2); inserir(&a, 3);
    printf("Q1 contar(3): %d  (esperado: 3)\n", contar(&a, 3));

    /* --- Q2: pop --- */
    printf("Q2 pop: %d  (esperado: 3)\n", pop(&a));
    exibir(&a);

    /* --- Q3: inserirPos --- */
    inserirPos(&a, 0, 99);
    printf("Q3 inserirPos(0, 99): ");
    exibir(&a);

    /* --- Q4: copiar --- */
    criar(&b, 10);
    copiar(&b, &a);
    printf("Q4 copiar: ");
    exibir(&b);

    /* --- Q5: estender --- */
    LISTA c;
    criar(&c, 20);
    inserir(&c, 10); inserir(&c, 20);
    estender(&c, &a);
    printf("Q5 estender: ");
    exibir(&c);

    /* --- Q6: inverter --- */
    LISTA inv;
    criar(&inv, 10);
    inverter(&inv, &a);
    printf("Q6 inverter: ");
    exibir(&inv);

    /* --- Q7: redimensionar --- */
    redimensionar(&a, 5);
    printf("Q7 redimensionar(5): MAX=%d\n", a.MAX);
    redimensionar(&a, 2);  /* deve recusar (tamanho > 2) */

    /* --- Q8: inserirv2 (cresce automaticamente) --- */
    LISTA d;
    criar(&d, 2);
    for (int i = 0; i < 8; i++) inserirv2(&d, i * 10);
    printf("Q8 inserirv2 (8 elementos em MAX=2): ");
    exibir(&d);

    /* --- Q9: ordenar --- */
    LISTA e;
    criar(&e, 8);
    inserir(&e, 5); inserir(&e, 1); inserir(&e, 4);
    inserir(&e, 2); inserir(&e, 8); inserir(&e, 3);
    ordenar(&e);
    printf("Q9 ordenar: ");
    exibir(&e);

    destruir(&a); destruir(&b); destruir(&c);
    destruir(&inv); destruir(&d); destruir(&e);

    return 0;
}
