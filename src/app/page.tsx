import { ArrowDownRight, ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";

import { landingServices, portfolioSlots } from "@/components/landing/content";
import { MotionArticle, MotionFigure, MotionSection, Reveal, StaggerGroup } from "@/components/landing/landing-motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <div className="landing-shell">
        <SiteHeader variant="dark" />
        <main>
          <MotionSection className="landing-hero" preset="fade">
            <Reveal className="landing-frame landing-hero__frame" preset="frame" delay={0.12} aria-label="Місце для головної фотографії робіт студії" role="img">
              <span>Фото робіт · незабаром</span>
            </Reveal>
            <div className="landing-container landing-hero__content">
              <Reveal className="landing-hero__copy" delay={0.2}>
                <h1 className="landing-display">КОЛІР, ЩО ВІДЧУВАЄТЬСЯ.</h1>
                <p className="landing-service-line">ФАРБУВАННЯ · КЕРАТИН · БОТОКС</p>
                <Link href="/booking" className="landing-booking-button">
                  Записатися онлайн <ArrowUpRight aria-hidden="true" size={18} />
                </Link>
              </Reveal>
            </div>
          </MotionSection>

          <MotionSection id="services" className="landing-services">
            <div className="landing-container landing-services__grid">
              <Reveal className="landing-section-intro">
                <p className="landing-overline">Напрями роботи</p>
                <h2 className="landing-section-title">Результат починається з чесного діалогу.</h2>
                <Link href="/services" className="landing-inline-link">
                  Усі послуги <ArrowDownRight aria-hidden="true" size={18} />
                </Link>
              </Reveal>
              <StaggerGroup className="landing-service-list" delay={0.12}>
                {landingServices.map((service) => (
                  <MotionArticle key={service.number} className="landing-service-row">
                    <span className="landing-service-number">{service.number}</span>
                    <div>
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                    </div>
                  </MotionArticle>
                ))}
              </StaggerGroup>
            </div>
          </MotionSection>

          <MotionSection id="about" className="landing-approach" preset="fade">
            <div className="landing-container landing-approach__grid">
              <Reveal className="landing-frame landing-approach__frame" preset="frame" aria-label="Місце для фотографії роботи колористки" role="img">
                <span>Процес у студії · незабаром</span>
              </Reveal>
              <Reveal className="landing-approach__copy" delay={0.12}>
                <p className="landing-overline">Підхід майстрині</p>
                <h2 className="landing-section-title">Не маскуємо проблему — знаходимо рішення.</h2>
                <p>
                  Спочатку розбираємося з вашим запитом, звичками й станом волосся. Потім обираємо техніку та догляд,
                  які будуть працювати не лише в день процедури.
                </p>
                <Link href="/booking" className="landing-text-action">
                  Обрати консультацію <ArrowUpRight aria-hidden="true" size={17} />
                </Link>
              </Reveal>
            </div>
          </MotionSection>

          <MotionSection className="landing-portfolio">
            <div className="landing-container">
              <Reveal className="landing-portfolio__heading">
                <div>
                  <p className="landing-overline">Портфоліо</p>
                  <h2 className="landing-section-title">Трансформації, що говорять самі за себе.</h2>
                </div>
                <p>Скоро тут з’являться реальні роботи студії.</p>
              </Reveal>
              <StaggerGroup className="landing-portfolio__grid" delay={0.1}>
                {portfolioSlots.map((slot, index) => (
                  <MotionFigure key={slot.label} className={"landing-portfolio-slot landing-portfolio-slot--" + (index + 1)}>
                    <div className="landing-frame" aria-label={slot.alt} role="img">
                      <span>{slot.label}</span>
                    </div>
                    <figcaption>Фото результату · незабаром</figcaption>
                  </MotionFigure>
                ))}
              </StaggerGroup>
            </div>
          </MotionSection>

          <MotionSection className="landing-booking" preset="fade">
            <div className="landing-container landing-booking__inner">
              <Reveal>
                <p className="landing-overline">Онлайн-запис</p>
                <h2 className="landing-section-title">Оберіть послугу й зручний час.</h2>
                <p>Система покаже вільні слоти, а студія підтвердить запис після звернення.</p>
              </Reveal>
              <Link href="/booking" className="landing-booking-button">
                Перейти до запису <ArrowUpRight aria-hidden="true" size={18} />
              </Link>
            </div>
          </MotionSection>

          <MotionSection id="contacts" className="landing-contacts">
            <div className="landing-container landing-contacts__grid">
              <Reveal>
                <p className="landing-overline">Контакти</p>
                <h2 className="landing-section-title">До зустрічі в Умані.</h2>
                <p className="landing-location">
                  <MapPin aria-hidden="true" size={18} /> Умань, Україна
                </p>
              </Reveal>
              <Reveal className="landing-contacts__cta" delay={0.1}>
                <p>Потрібна порада до запису? Почніть із консультації колориста.</p>
                <Link href="/booking" className="landing-text-action">
                  Обрати консультацію <ArrowUpRight aria-hidden="true" size={17} />
                </Link>
              </Reveal>
            </div>
          </MotionSection>
        </main>
      </div>
      <SiteFooter variant="dark" />
    </>
  );
}
