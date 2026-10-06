import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';

interface Medicamento {
  id: number;
  nombre: string;
  descripcion?: string;
  presentacion?: string;
  dosis?: string;
  cantidad_disponible: number;
  fecha_caducidad: string;
  lote?: string;
  proveedor?: string;
  activo: boolean;
}

type Filtro = 'todos' | 'bajo_stock' | 'por_vencer' | 'vencidos';

const STOCK_MINIMO = 10;
const DIAS_ALERTA = 30;

/** Fecha ISO (yyyy-mm-dd) a N días de hoy: mantiene los datos de demostración vigentes. */
const enDias = (dias: number) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
};

const diasParaCaducar = (m: Medicamento) =>
  Math.ceil((new Date(m.fecha_caducidad).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

function estadoDe(m: Medicamento): { texto: string; clase: string } {
  const dias = diasParaCaducar(m);
  if (dias <= 0) return { texto: 'Vencido', clase: 'badge badge--rojo' };
  if (dias <= DIAS_ALERTA) return { texto: `Vence en ${dias} días`, clase: 'badge badge--ambar' };
  if (m.cantidad_disponible <= STOCK_MINIMO) return { texto: 'Stock bajo', clase: 'badge badge--rojo' };
  return { texto: 'Disponible', clase: 'badge badge--verde' };
}

const DATOS_DEMO = (): Medicamento[] => [
  { id: 1, nombre: 'Losartán 50mg', descripcion: 'Antihipertensivo para hipertensión arterial', presentacion: 'Tabletas', dosis: '50mg', cantidad_disponible: 45, fecha_caducidad: enDias(320), lote: 'LOT2024001', proveedor: 'Laboratorios XYZ', activo: true },
  { id: 2, nombre: 'Metformina 850mg', descripcion: 'Antidiabético oral para control de glucosa', presentacion: 'Tabletas', dosis: '850mg', cantidad_disponible: 8, fecha_caducidad: enDias(18), lote: 'LOT2024002', proveedor: 'Farmacéutica ABC', activo: true },
  { id: 3, nombre: 'Omeprazol 20mg', descripcion: 'Inhibidor de bomba de protones', presentacion: 'Cápsulas', dosis: '20mg', cantidad_disponible: 120, fecha_caducidad: enDias(610), lote: 'LOT2024003', proveedor: 'Laboratorios DEF', activo: true },
  { id: 4, nombre: 'Atorvastatina 20mg', descripcion: 'Estatina para reducción de colesterol', presentacion: 'Tabletas', dosis: '20mg', cantidad_disponible: 60, fecha_caducidad: enDias(-12), lote: 'LOT2024004', proveedor: 'Laboratorios GHI', activo: true },
  { id: 5, nombre: 'Paracetamol 500mg', descripcion: 'Analgésico y antipirético', presentacion: 'Tabletas', dosis: '500mg', cantidad_disponible: 200, fecha_caducidad: enDias(210), lote: 'LOT2024005', proveedor: 'Farmacéutica JKL', activo: true },
  { id: 6, nombre: 'Enalapril 10mg', descripcion: 'Inhibidor de la ECA para presión arterial', presentacion: 'Tabletas', dosis: '10mg', cantidad_disponible: 6, fecha_caducidad: enDias(400), lote: 'LOT2024006', proveedor: 'Laboratorios XYZ', activo: true },
];

export default function InventarioMedicamentosView() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useEffect(() => {
    // Simular carga de medicamentos
    const timer = setTimeout(() => {
      setMedicamentos(DATOS_DEMO());
      setCargando(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const esVencido = (m: Medicamento) => diasParaCaducar(m) <= 0;
  const esPorVencer = (m: Medicamento) => {
    const d = diasParaCaducar(m);
    return d > 0 && d <= DIAS_ALERTA;
  };
  const esBajoStock = (m: Medicamento) => m.cantidad_disponible <= STOCK_MINIMO;

  const filtros: Array<{ id: Filtro; etiqueta: string; cuenta: number }> = useMemo(
    () => [
      { id: 'todos', etiqueta: 'Todos', cuenta: medicamentos.length },
      { id: 'bajo_stock', etiqueta: 'Stock bajo', cuenta: medicamentos.filter(esBajoStock).length },
      { id: 'por_vencer', etiqueta: 'Por vencer', cuenta: medicamentos.filter(esPorVencer).length },
      { id: 'vencidos', etiqueta: 'Vencidos', cuenta: medicamentos.filter(esVencido).length },
    ],
    [medicamentos]
  );

  const visibles = medicamentos.filter((m) => {
    if (filtro === 'vencidos') return esVencido(m);
    if (filtro === 'por_vencer') return esPorVencer(m);
    if (filtro === 'bajo_stock') return esBajoStock(m);
    return true;
  });

  return (
    <div>
      <PageHeader titulo="Inventario de medicamentos" descripcion="Controla el stock y las fechas de caducidad de los medicamentos del hogar." />

      {cargando ? (
        <div className="cargando-bloque" role="status">
          <div className="spinner" />
          <p>Cargando inventario…</p>
        </div>
      ) : (
        <>
          <div className="barra-herramientas">
            <div className="chips" role="group" aria-label="Filtrar inventario">
              {filtros.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`chip ${filtro === f.id ? 'chip--activo' : ''}`}
                  aria-pressed={filtro === f.id}
                  onClick={() => setFiltro(f.id)}
                >
                  {f.etiqueta}
                  <span className="chip__cuenta">{f.cuenta}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Presentación</th>
                  <th>Dosis</th>
                  <th>Stock</th>
                  <th>Caducidad</th>
                  <th>Lote</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((m) => {
                  const estado = estadoDe(m);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="tabla__paciente">
                          <div>
                            <strong>{m.nombre}</strong>
                            <small>{m.descripcion}</small>
                          </div>
                        </div>
                      </td>
                      <td>{m.presentacion || '-'}</td>
                      <td>{m.dosis || '-'}</td>
                      <td className="tabla__numero">
                        <strong>{m.cantidad_disponible}</strong> <small>uds.</small>
                      </td>
                      <td>{new Date(m.fecha_caducidad).toLocaleDateString('es-CO')}</td>
                      <td>{m.lote || '-'}</td>
                      <td>
                        <span className={estado.clase}>{estado.texto}</span>
                      </td>
                    </tr>
                  );
                })}

                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="tabla__vacio">
                      Ningún medicamento cumple este filtro. Prueba con “Todos” para ver el inventario completo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
