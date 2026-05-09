import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-sans text-gray-900 bg-[#FAFAFA] min-h-screen flex flex-col selection:bg-wavi-blue selection:text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 px-6 container mx-auto">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">Política de Privacidad — Wavi</h1>
          <p className="text-sm text-gray-400 mb-10">Fecha de entrada en vigencia: 9 de febrero de 2026</p>

          <div className="prose max-w-none text-gray-600 space-y-10">

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Responsable del Tratamiento</h2>
              <p>
                El responsable del tratamiento de los datos personales es <strong>Juan David Paez Barajas</strong>,
                identificado con cédula de ciudadanía 1019602677, domiciliado en Bogotá D.C., Colombia.
                Contacto: <a href="mailto:Juan@waviapp.com" className="text-[#25B3CC] hover:underline">Juan@waviapp.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Descripción del Servicio</h2>
              <p>
                Wavi es una aplicación móvil que permite a los usuarios descubrir planes, lugares, eventos y promociones
                en Colombia. La aplicación muestra información en función de la ubicación del usuario y permite la creación
                de cuentas para acceder a funcionalidades adicionales como reseñas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Información Recolectada</h2>

              <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">3.1 Datos proporcionados directamente por el usuario al registrarse:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombre completo</li>
                <li>Correo electrónico</li>
                <li>Fecha de nacimiento</li>
                <li>Contraseña (almacenada de forma cifrada)</li>
                <li>Foto de perfil (opcional)</li>
                <li>Género (opcional)</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">3.2 Datos recolectados mediante Google Sign-In:</h3>
              <p>
                Cuando el usuario elige iniciar sesión con Google, Wavi recibe de Google el nombre y correo electrónico
                asociados a la cuenta de Google del usuario. Este proceso está sujeto adicionalmente a la Política de
                Privacidad de Google.
              </p>

              <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">3.3 Datos generados por el uso de la aplicación:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Ubicación geográfica en tiempo real, utilizada para mostrar lugares cercanos y calcular distancias</li>
                <li>Historial de búsquedas (almacenado localmente en el dispositivo, no en servidores)</li>
                <li>Reseñas y calificaciones publicadas por el usuario sobre lugares</li>
                <li>Dirección IP e información técnica del dispositivo</li>
              </ul>

              <h3 className="text-base font-semibold text-gray-700 mt-4 mb-2">3.4 Datos almacenados localmente en el dispositivo:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Caché de contenido (imágenes y datos de lugares) para funcionamiento sin conexión</li>
                <li>Historial de búsquedas recientes</li>
                <li>Preferencia de sesión de invitado</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Finalidades del Tratamiento</h2>
              <p className="mb-2">Los datos recolectados son utilizados para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Crear y gestionar la cuenta del usuario</li>
                <li>Mostrar planes y lugares cercanos según la ubicación</li>
                <li>Permitir al usuario publicar y gestionar reseñas</li>
                <li>Mejorar la experiencia de uso de la aplicación</li>
                <li>Analizar el rendimiento y uso de la plataforma</li>
                <li>Enviar notificaciones relacionadas con el servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Proveedores Tecnológicos</h2>
              <p className="mb-2">Para la operación del servicio, Wavi utiliza los siguientes proveedores:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Supabase:</strong> proveedor de base de datos, autenticación y almacenamiento de archivos.
                  Los datos pueden ser procesados en servidores ubicados fuera de Colombia.
                </li>
                <li>
                  <strong>Google (Sign-In y Maps):</strong> servicio de autenticación con Google y visualización de mapas.
                  Sujeto a las políticas de privacidad de Google.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Usuarios Invitados</h2>
              <p>
                La aplicación permite el uso sin registro como invitado. En este modo no se recolectan datos personales
                identificables. Solo se almacena localmente en el dispositivo una preferencia indicando que el usuario
                aceptó continuar como invitado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Menores de Edad</h2>
              <p>
                La aplicación no está dirigida a menores de 14 años. Wavi no recolecta intencionalmente datos personales
                de menores. Si se detecta que un menor ha proporcionado datos sin autorización, dicha información será
                eliminada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Compartición de la Información</h2>
              <p className="mb-2">La información recolectada podrá ser compartida únicamente con:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Proveedores tecnológicos necesarios para el funcionamiento de la aplicación (Supabase, Google)</li>
                <li>Autoridades competentes cuando exista obligación legal</li>
              </ul>
              <p className="mt-3">
                En ningún caso la información será vendida o compartida con terceros con fines publicitarios.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Derechos de los Titulares</h2>
              <p className="mb-2">Conforme a la Ley 1581 de 2012, los usuarios tienen derecho a:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Acceder a sus datos personales</li>
                <li>Actualizar o rectificar su información desde la sección de perfil de la aplicación</li>
                <li>Eliminar su cuenta y datos directamente desde la aplicación en la sección de configuración de cuenta</li>
                <li>Revocar la autorización del tratamiento de sus datos</li>
                <li>Presentar quejas ante la Superintendencia de Industria y Comercio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Canales de Atención</h2>
              <p>
                Las solicitudes relacionadas con el tratamiento de datos deben enviarse a:{' '}
                <a href="mailto:Juan@waviapp.com" className="text-[#25B3CC] hover:underline">Juan@waviapp.com</a>
              </p>
              <p className="mt-2">Tiempo de respuesta: 10 a 15 días hábiles.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Modificaciones</h2>
              <p>
                Wavi se reserva el derecho de modificar esta política en cualquier momento. Los cambios serán informados
                a través de la aplicación.
              </p>
            </section>



          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
