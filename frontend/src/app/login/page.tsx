import Image from "next/image";
import Link from "next/link";
import LoginComponent from "@/components/loginComponent";

export default function LoginPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 min-h-screen">
      <div className="flex flex-col justify-center items-center lg:col-span-3 text-center text-emerald-800 p-6 md:p-8 min-h-[50vh] lg:min-h-0">
        <h2 className="font-semibold text-2xl md:text-3xl">
          Seja bem-vindo(a) <br /> ao
        </h2>

        <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl my-2">
          Econnect
        </h1>

        <div className="relative w-full max-w-[200px] md:max-w-[350px] lg:max-w-[500px] mt-4">
          <Image
            src="/tigreen.png"
            alt="Logo"
            width={500}
            height={500}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>

      <div className="flex flex-col items-center lg:col-span-2 bg-emerald-800 text-amber-50 text-center p-6 md:p-8 min-h-[50vh] lg:min-h-0">
        <section className="mb-6 lg:mt-32">
          <h2 className="font-semibold text-2xl md:text-3xl mb-2">
            Faça seu Login
          </h2>
          <p className="text-sm md:text-base mb-2">
            Preencha com suas informações abaixo
          </p>
        </section>

        <LoginComponent />

        <p className="text-sm md:text-base mt-4">
          Não possui uma conta?{" "}
          <Link
            href="/register"
            className="text-amber-50 font-semibold underline hover:text-amber-100"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
