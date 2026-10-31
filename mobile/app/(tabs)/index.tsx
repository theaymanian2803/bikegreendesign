import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeHeader } from "../../components/home/HomeHeader";
import { LandingSections } from "../../components/home/LandingSections";
import { NewsletterSection } from "../../components/home/NewsletterSection";
import { Loading } from "../../components/ui/Loading";
import { useBootstrap, useReviews } from "../../lib/queries";
import { colors, spacing } from "../../lib/theme";

export default function HomeScreen() {
  const { data, isLoading, error } = useBootstrap();
  const { data: reviews = [] } = useReviews(6);

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <HomeHeader />
      </SafeAreaView>
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Loading />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            gap: spacing.section,
            paddingBottom: 30,
            paddingHorizontal: spacing.screen,
            paddingTop: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <LandingSections
            sections={data.sections}
            categories={data.categories}
            products={data.products}
            reviews={reviews}
          />
          <NewsletterSection />
        </ScrollView>
      )}
    </View>
  );
}
