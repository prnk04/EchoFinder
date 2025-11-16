import React from "react";
import { ColorValue, StyleProp, Text, TextStyle, TouchableHighlight, TouchableHighlightProps, View, ViewStyle } from "react-native";

type PressableOptionProps = {
    text: string;
    textStyle?: StyleProp<TextStyle>;
    backgroundStyle?: StyleProp<ViewStyle>;
    buttonStyle?: StyleProp<ViewStyle>;
    onPress?: TouchableHighlightProps["onPress"];
    underlayColor?: ColorValue
    id?: String
};

const CardComponent = ({ text, textStyle, backgroundStyle, buttonStyle, onPress, underlayColor, id }: PressableOptionProps) => {
    return (
        <View style={backgroundStyle} key={'View_' + id }>
            <TouchableHighlight
                style={buttonStyle}
                underlayColor={underlayColor}
                onPress={onPress}
                key={'TH_' + id}
            >
                <Text style={textStyle} key={'Text_' + id}>{text}</Text>
            </TouchableHighlight>
        </View>
    )
}

export default CardComponent;