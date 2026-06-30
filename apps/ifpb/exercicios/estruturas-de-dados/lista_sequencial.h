#ifndef LISTA_SEQUENCIAL_H
#define LISTA_SEQUENCIAL_H

typedef struct {
    int *dados;
    int tamanho;  /* quantidade atual de elementos */
    int MAX;      /* capacidade máxima do array */
} LISTA;

/* --- base (Atividade 4 Voldemort) --- */
void criar(LISTA *lst, int max);
void destruir(LISTA *lst);
void inserir(LISTA *lst, int valor);
void exibir(LISTA *lst);
int  buscar(LISTA *lst, int valor);      /* retorna índice ou -1 */
void remover_idx(LISTA *lst, int idx);

/* --- questões extra --- */
int  contar(LISTA *lst, int valor);                         /* Q1 */
int  pop(LISTA *lst);                                       /* Q2 */
void inserirPos(LISTA *lst, int pos, int valor);            /* Q3 */
void copiar(LISTA *lst1, LISTA *lst2);                      /* Q4 */
void estender(LISTA *lst1, LISTA *lst2);                    /* Q5 */
void inverter(LISTA *lst1, LISTA *lst2);                    /* Q6 */
void redimensionar(LISTA *lst, int novoMAX);                /* Q7 */
void inserirv2(LISTA *lst, int valor);                      /* Q8 */
void inserirPosv2(LISTA *lst, int pos, int valor);          /* Q8 */
void copiarv2(LISTA *lst1, LISTA *lst2);                    /* Q8 */
void estenderv2(LISTA *lst1, LISTA *lst2);                  /* Q8 */
void inverterv2(LISTA *lst1, LISTA *lst2);                  /* Q8 */
void ordenar(LISTA *lst);                                   /* Q9 */

#endif
