/**
 * Configurazione Firebase per la sincronizzazione con Google.
 *
 * Questi valori NON sono segreti (finiscono comunque nel browser di chi usa l'app):
 * la protezione dei dati sta nelle regole di Firestore, che permettono a ognuno di leggere
 * e scrivere solo il proprio documento. Finché resta `null` la sincronizzazione è spenta
 * e l'app funziona come prima (progressi solo su questo dispositivo).
 *
 * Come ottenerli: vedi la sezione "Sincronizzazione con Google" nel README.
 */
export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
  messagingSenderId?: string
}

export const FIREBASE_CONFIG: FirebaseWebConfig | null = {
  apiKey: 'AIzaSyDnKgkb8gU3ylm4M66BNx_sOgNUdRlFyEc',
  authDomain: 'gigiscacchi-b8cbf.firebaseapp.com',
  projectId: 'gigiscacchi-b8cbf',
  storageBucket: 'gigiscacchi-b8cbf.firebasestorage.app',
  messagingSenderId: '92281344268',
  appId: '1:92281344268:web:141e41dd24587e5a487929',
}
