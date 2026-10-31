import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Heart, Minus, Plus, Star } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTabBar } from "../../components/AppTabBar";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { Loading } from "../../components/ui/Loading";
import { resolveMediaUrl } from "../../lib/api";
import { useCart } from "../../lib/cart";
import { useFavorites } from "../../lib/favorites";
import { formatMoney } from "../../lib/format";
import { useCreateReview, useProduct } from "../../lib/queries";
import { colors, fonts, radius, shadows, spacing, typeScale } from "../../lib/theme";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const slug = typeof id === "string" ? id : "";
  const { data, isLoading } = useProduct(slug);
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const createReview = useCreateReview();
  const [qty, setQty] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  if (isLoading || !data) {
    return (
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
        <Loading />
        <AppTabBar />
      </SafeAreaView>
    );
  }

  const { product, related, reviews } = data;
  const saved = isFavorite(product.id);
  const soldOut = product.badge === "Out of stock";

  function submitReview() {
    if (!author.trim() || !body.trim()) return;
    createReview.mutate(
      {
        productSlug: product.id,
        author: author.trim(),
        rating,
        title: title.trim(),
        body: body.trim(),
      },
      {
        onSuccess: () => {
          setAuthor("");
          setTitle("");
          setBody("");
          setReviewOpen(false);
        },
      },
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 18,
          paddingBottom: 30,
          paddingHorizontal: spacing.screen,
          paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              alignItems: "center",
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.pill,
              borderWidth: 1,
              height: 42,
              justifyContent: "center",
              width: 42,
            }}
          >
            <ArrowLeft color={colors.ink} size={22} />
          </Pressable>
          <Text style={{ color: colors.muted, fontFamily: fonts.medium, ...typeScale.label }}>
            {product.category}
          </Text>
          <Pressable
            onPress={() => toggle(product)}
            style={{
              alignItems: "center",
              backgroundColor: saved ? colors.primarySoft : colors.card,
              borderColor: saved ? colors.primary : colors.border,
              borderRadius: radius.pill,
              borderWidth: 1,
              height: 42,
              justifyContent: "center",
              width: 42,
            }}
          >
            <Heart
              color={saved ? colors.primary : colors.ink}
              fill={saved ? colors.primary : "transparent"}
              size={21}
            />
          </Pressable>
        </View>

        <Image
          source={{ uri: resolveMediaUrl(product.image) }}
          style={{ borderRadius: radius.xl, height: 320, width: "100%" }}
          contentFit="cover"
        />

        {product.badge ? (
          <Text
            style={{
              alignSelf: "flex-start",
              backgroundColor: colors.primarySoft,
              borderRadius: radius.pill,
              color: colors.primary,
              fontFamily: fonts.bold,
              letterSpacing: 0.6,
              paddingHorizontal: 10,
              paddingVertical: 4,
              ...typeScale.micro,
            }}
          >
            {product.badge.toUpperCase()}
          </Text>
        ) : null}
        <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h1 }}>
          {product.name}
        </Text>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                color={n <= Math.round(product.rating) ? colors.star : colors.border}
                fill={n <= Math.round(product.rating) ? colors.star : "transparent"}
                size={15}
              />
            ))}
          </View>
          <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.label }}>
            {product.rating.toFixed(1)} · {reviews.count} reviews
          </Text>
        </View>
        <View style={{ alignItems: "baseline", flexDirection: "row", gap: 10 }}>
          <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.priceLg }}>
            {formatMoney(product.price)}
          </Text>
          {product.oldPrice ? (
            <Text
              style={{
                color: colors.muted,
                fontFamily: fonts.regular,
                textDecorationLine: "line-through",
                ...typeScale.body,
              }}
            >
              {formatMoney(product.oldPrice)}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
          <View
            style={{
              alignItems: "center",
              borderColor: colors.border,
              borderRadius: radius.pill,
              borderWidth: 1,
              flexDirection: "row",
              minHeight: 50,
            }}
          >
            <Pressable
              onPress={() => setQty((value) => Math.max(1, value - 1))}
              style={{ padding: 13 }}
            >
              <Minus color={colors.ink} size={17} />
            </Pressable>
            <Text style={{ color: colors.ink, fontFamily: fonts.semibold, ...typeScale.bodyLg }}>
              {qty}
            </Text>
            <Pressable onPress={() => setQty((value) => value + 1)} style={{ padding: 13 }}>
              <Plus color={colors.ink} size={17} />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={soldOut ? "Out of stock" : "Add to cart"}
              disabled={soldOut}
              onPress={() =>
                add(
                  {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  },
                  qty,
                )
              }
            />
          </View>
        </View>

        {product.description ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              gap: 8,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
              Description
            </Text>
            <Text style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.body }}>
              {product.description}
            </Text>
          </View>
        ) : null}

        {product.highlights?.length ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              gap: 7,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
              Highlights
            </Text>
            {product.highlights.map((item, index) => (
              <View key={index} style={{ flexDirection: "row", gap: 8 }}>
                <Text
                  style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.body }}
                >
                  •
                </Text>
                <Text
                  style={{
                    color: colors.muted,
                    flex: 1,
                    fontFamily: fonts.regular,
                    ...typeScale.body,
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {product.specs?.length ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.lg,
              borderWidth: 1,
              gap: 7,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
              Specifications
            </Text>
            {product.specs.map((spec, index) => (
              <View
                key={`${spec.label}-${index}`}
                style={{ flexDirection: "row", gap: 12, justifyContent: "space-between" }}
              >
                <Text
                  style={{
                    color: colors.muted,
                    flex: 1,
                    fontFamily: fonts.regular,
                    ...typeScale.bodySmall,
                  }}
                >
                  {spec.label}
                </Text>
                <Text
                  style={{
                    color: colors.ink,
                    flexShrink: 1,
                    fontFamily: fonts.medium,
                    textAlign: "right",
                    ...typeScale.bodySmall,
                  }}
                >
                  {spec.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <View
            style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
              Reviews
            </Text>
            <Text
              onPress={() => setReviewOpen((value) => !value)}
              style={{ color: colors.primary, fontFamily: fonts.semibold, ...typeScale.label }}
            >
              {reviewOpen ? "Close" : "Write a review"}
            </Text>
          </View>

          {reviewOpen ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.lg,
                borderWidth: 1,
                gap: 12,
                padding: 16,
              }}
            >
              <Input label="Your name" value={author} onChangeText={setAuthor} />
              <View style={{ gap: 8 }}>
                <Text
                  style={{ color: colors.muted, fontFamily: fonts.semibold, ...typeScale.label }}
                >
                  Rating
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setRating(n)} hitSlop={4}>
                      <Star
                        color={n <= rating ? colors.star : colors.border}
                        fill={n <= rating ? colors.star : "transparent"}
                        size={26}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
              <Input label="Title" value={title} onChangeText={setTitle} />
              <Input label="Review" value={body} onChangeText={setBody} multiline />
              {createReview.isSuccess ? (
                <Text
                  style={{ color: colors.success, fontFamily: fonts.regular, ...typeScale.label }}
                >
                  Thanks — your review is awaiting approval.
                </Text>
              ) : null}
              {createReview.isError ? (
                <Text
                  style={{ color: colors.primary, fontFamily: fonts.regular, ...typeScale.label }}
                >
                  {createReview.error instanceof Error
                    ? createReview.error.message
                    : "Could not submit."}
                </Text>
              ) : null}
              <Button
                label={createReview.isPending ? "Sending…" : "Submit review"}
                onPress={submitReview}
                loading={createReview.isPending}
                disabled={!author.trim() || !body.trim()}
              />
            </View>
          ) : null}

          {reviews.reviews.length === 0 ? (
            <EmptyState message="No reviews yet" hint="Be the first to review this product." />
          ) : (
            reviews.reviews.map((review) => (
              <View
                key={review.id}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  gap: 6,
                  padding: 15,
                  ...shadows.card,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text
                    style={{
                      color: colors.ink,
                      fontFamily: fonts.semibold,
                      ...typeScale.bodySmall,
                    }}
                  >
                    {review.author}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        color={n <= review.rating ? colors.star : colors.border}
                        fill={n <= review.rating ? colors.star : "transparent"}
                        size={13}
                      />
                    ))}
                  </View>
                </View>
                {review.title ? (
                  <Text
                    style={{ color: colors.ink, fontFamily: fonts.medium, ...typeScale.bodySmall }}
                  >
                    {review.title}
                  </Text>
                ) : null}
                <Text
                  style={{ color: colors.muted, fontFamily: fonts.regular, ...typeScale.bodySmall }}
                >
                  {review.body}
                </Text>
              </View>
            ))
          )}
        </View>

        {related.length > 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.ink, fontFamily: fonts.display, ...typeScale.h3 }}>
              You may also like
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {related.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/product/${item.id}`)}
                  style={{ width: 160 }}
                >
                  <Image
                    source={{ uri: resolveMediaUrl(item.image) }}
                    style={{ borderRadius: radius.lg, height: 118, width: "100%" }}
                    contentFit="cover"
                  />
                  <Text
                    numberOfLines={2}
                    style={{
                      color: colors.ink,
                      fontFamily: fonts.semibold,
                      marginTop: 6,
                      ...typeScale.bodySmall,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.ink, fontFamily: fonts.bold, ...typeScale.price }}>
                    {formatMoney(item.price)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
      <AppTabBar />
    </SafeAreaView>
  );
}
